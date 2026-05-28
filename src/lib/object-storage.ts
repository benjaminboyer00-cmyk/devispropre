import fs from "fs/promises";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { logCriticalAlert } from "./critical-alert";

const PDF_DIR = path.join(process.cwd(), "storage", "pdfs");
const PENDING_QUEUE_PATH = path.join(process.cwd(), "storage", "r2-pending-uploads.json");
const DEAD_LETTER_PATH = path.join(process.cwd(), "storage", "r2-dead-letter.json");

const UPLOAD_RETRY_ATTEMPTS = 3;
const SYNC_MAX_FAILURES = 3;

export class ObjectStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectStorageError";
  }
}

interface PendingR2Upload {
  key: string;
  failCount: number;
  lastError?: string;
  enqueuedAt: string;
}

function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
}

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export function devisPdfKey(userId: string, devisId: string): string {
  return `devis/${userId}/${devisId}.pdf`;
}

export function facturePdfKey(userId: string, factureId: string): string {
  return `factures/${userId}/${factureId}.pdf`;
}

export function attestationPdfKey(userId: string, factureId: string): string {
  return `attestations/${userId}/${factureId}.pdf`;
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filePath: string, items: T[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(items, null, 2));
}

async function readPendingQueue(): Promise<PendingR2Upload[]> {
  return readJsonFile<PendingR2Upload>(PENDING_QUEUE_PATH);
}

async function writePendingQueue(items: PendingR2Upload[]): Promise<void> {
  await writeJsonFile(PENDING_QUEUE_PATH, items);
}

async function appendDeadLetter(entry: PendingR2Upload): Promise<void> {
  const dead = await readJsonFile<PendingR2Upload>(DEAD_LETTER_PATH);
  dead.push({ ...entry, enqueuedAt: new Date().toISOString() });
  await writeJsonFile(DEAD_LETTER_PATH, dead);
}

export async function enqueuePendingR2Upload(key: string, lastError?: string): Promise<void> {
  const queue = await readPendingQueue();
  const existing = queue.find((item) => item.key === key);
  if (existing) {
    existing.lastError = lastError;
    existing.enqueuedAt = new Date().toISOString();
  } else {
    queue.push({
      key,
      failCount: 0,
      lastError,
      enqueuedAt: new Date().toISOString(),
    });
  }
  await writePendingQueue(queue);
}

async function removePendingR2Upload(key: string): Promise<void> {
  await writePendingQueue((await readPendingQueue()).filter((item) => item.key !== key));
}

async function writeLocalPdf(key: string, buffer: Buffer): Promise<void> {
  const filePath = path.join(PDF_DIR, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
}

async function readFromR2(key: string): Promise<Buffer | null> {
  if (!isR2Configured()) return null;
  try {
    const client = getR2Client();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
      })
    );
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch {
    return null;
  }
}

async function readLocalPdf(key: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(PDF_DIR, key));
  } catch {
    return null;
  }
}

async function uploadToR2Once(key: string, buffer: Buffer): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

async function uploadToR2WithRetry(key: string, buffer: Buffer): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= UPLOAD_RETRY_ATTEMPTS; attempt++) {
    try {
      await uploadToR2Once(key, buffer);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < UPLOAD_RETRY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Persiste le PDF figé et retourne le chemin API authentifié (jamais d'URL publique directe). */
export async function archivePdf(
  key: string,
  buffer: Buffer,
  apiPath: string
): Promise<string> {
  if (buffer.length === 0) {
    throw new ObjectStorageError("Le PDF généré est vide.");
  }

  if (isR2Configured()) {
    try {
      await uploadToR2WithRetry(key, buffer);
      await removePendingR2Upload(key);
    } catch (err) {
      await writeLocalPdf(key, buffer);
      const message = err instanceof Error ? err.message : String(err);
      await enqueuePendingR2Upload(key, message);
      logCriticalAlert("Upload R2 en file d'attente locale", { key, error: message });
    }
  } else {
    await writeLocalPdf(key, buffer);
  }

  return apiPath;
}

export async function readArchivedPdf(key: string): Promise<Buffer | null> {
  const fromR2 = await readFromR2(key);
  if (fromR2) return fromR2;
  return readLocalPdf(key);
}

/** Rattrapage des PDF en attente sur R2 (cron). Après 3 échecs → dead letter + alerte. */
export async function syncPendingR2Uploads(): Promise<{
  synced: number;
  failed: number;
  deadLetter: number;
}> {
  if (!isR2Configured()) {
    return { synced: 0, failed: 0, deadLetter: 0 };
  }

  let synced = 0;
  let failed = 0;
  let deadLetter = 0;
  const queue = await readPendingQueue();
  const remaining: PendingR2Upload[] = [];

  for (const item of queue) {
    const buffer = await readLocalPdf(item.key);
    if (!buffer) {
      logCriticalAlert("PDF local absent pour sync R2", { key: item.key });
      deadLetter += 1;
      await appendDeadLetter({ ...item, lastError: "Fichier local introuvable" });
      continue;
    }

    try {
      await uploadToR2WithRetry(item.key, buffer);
      synced += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const nextFailCount = item.failCount + 1;
      if (nextFailCount >= SYNC_MAX_FAILURES) {
        deadLetter += 1;
        await appendDeadLetter({ ...item, failCount: nextFailCount, lastError: message });
        logCriticalAlert("PDF R2 en dead letter après échecs répétés", {
          key: item.key,
          failCount: nextFailCount,
          error: message,
        });
      } else {
        failed += 1;
        remaining.push({ ...item, failCount: nextFailCount, lastError: message });
      }
    }
  }

  await writePendingQueue(remaining);
  return { synced, failed, deadLetter };
}

/** Supprime un PDF orphelin (R2 + fallback local). */
export async function deleteArchivedPdf(key: string): Promise<void> {
  if (isR2Configured()) {
    try {
      const client = getR2Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
        })
      );
    } catch (err) {
      logCriticalAlert("Échec suppression PDF R2", { key, error: String(err) });
    }
  }

  try {
    await fs.unlink(path.join(PDF_DIR, key));
  } catch {
    // Fichier local absent — normal si stockage R2 uniquement
  }

  await removePendingR2Upload(key);
}

export function isObjectStorageConfigured(): boolean {
  return isR2Configured();
}

export async function pendingR2UploadCount(): Promise<number> {
  return (await readPendingQueue()).length;
}
