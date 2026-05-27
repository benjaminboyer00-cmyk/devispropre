import fs from "fs/promises";
import path from "path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const PDF_DIR = path.join(process.cwd(), "storage", "pdfs");

export class ObjectStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectStorageError";
  }
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

async function uploadToR2(key: string, buffer: Buffer): Promise<void> {
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

/** Persiste le PDF figé et retourne l'URL publique ou le chemin API interne. */
export async function archivePdf(
  key: string,
  buffer: Buffer,
  apiPath: string
): Promise<string> {
  if (buffer.length === 0) {
    throw new ObjectStorageError("Le PDF généré est vide.");
  }

  if (isR2Configured()) {
    await uploadToR2(key, buffer);
    const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (publicBase) return `${publicBase}/${key}`;
  }

  await writeLocalPdf(key, buffer);
  return apiPath;
}

export async function readArchivedPdf(key: string): Promise<Buffer | null> {
  const fromR2 = await readFromR2(key);
  if (fromR2) return fromR2;
  return readLocalPdf(key);
}

export function isObjectStorageConfigured(): boolean {
  return isR2Configured();
}
