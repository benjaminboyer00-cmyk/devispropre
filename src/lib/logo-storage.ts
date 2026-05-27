import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const LOGO_DIR = path.join(process.cwd(), "storage", "logos");
export const MAX_LOGO_BYTES = 500_000;

const DATA_URI_RE = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

export function logoApiPath(userId: string): string {
  return `/api/logos/${userId}`;
}

/** Vérifie les magic bytes réels — pas seulement le MIME déclaré. */
export function assertImageMagicBytes(buffer: Buffer): void {
  if (buffer.length < 12) throw new Error("Fichier image trop petit ou corrompu.");

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  const isWebp =
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isPng && !isJpeg && !isWebp) {
    throw new Error("Format refusé — PNG, JPG ou WebP uniquement (magic bytes invalides).");
  }
}

/** Re-encode en PNG pur via Sharp (supprime métadonnées, SVG/XML embarqués, scripts). */
export async function sanitizeLogoToPng(buffer: Buffer): Promise<Buffer> {
  assertImageMagicBytes(buffer);
  try {
    const png = await sharp(buffer, { failOn: "error", animated: false })
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9, force: true })
      .toBuffer();

    if (png.length === 0 || png.length > MAX_LOGO_BYTES) {
      throw new Error(`Logo trop volumineux (max ${MAX_LOGO_BYTES / 1000} Ko).`);
    }
    return png;
  } catch {
    throw new Error("Image invalide ou corrompue.");
  }
}

/** Valide un data URI image et retourne un PNG sanitizé. */
export async function parseLogoDataUri(dataUri: string): Promise<{ buffer: Buffer; ext: "png" }> {
  const match = DATA_URI_RE.exec(dataUri.trim());
  if (!match) {
    throw new Error("Logo invalide : PNG, JPG ou WebP en base64 uniquement.");
  }

  let raw: Buffer;
  try {
    raw = Buffer.from(match[2], "base64");
  } catch {
    throw new Error("Logo base64 invalide.");
  }

  if (raw.length === 0) {
    throw new Error("Logo vide.");
  }
  if (raw.length > MAX_LOGO_BYTES) {
    throw new Error(`Logo trop volumineux (max ${MAX_LOGO_BYTES / 1000} Ko).`);
  }

  const buffer = await sanitizeLogoToPng(raw);
  return { buffer, ext: "png" };
}

export async function saveLogoFile(userId: string, buffer: Buffer, _ext?: string): Promise<string> {
  const png = await sanitizeLogoToPng(buffer);
  await mkdir(LOGO_DIR, { recursive: true });

  for (const oldExt of ["png", "jpg", "webp"]) {
    await unlink(path.join(LOGO_DIR, `${userId}.${oldExt}`)).catch(() => undefined);
  }

  await writeFile(path.join(LOGO_DIR, `${userId}.png`), png);
  return logoApiPath(userId);
}

export async function loadLogoBuffer(userId: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(LOGO_DIR, `${userId}.png`));
  } catch {
    for (const ext of ["jpg", "webp"]) {
      try {
        const legacy = await readFile(path.join(LOGO_DIR, `${userId}.${ext}`));
        return sanitizeLogoToPng(legacy);
      } catch {
        /* absent */
      }
    }
  }
  return null;
}

/** Compat legacy : data URI encore en base (migration progressive). */
export async function parseLegacyLogoDataUri(
  logoUrl: string | null | undefined
): Promise<Buffer | null> {
  if (!logoUrl?.startsWith("data:image")) return null;
  try {
    const { buffer } = await parseLogoDataUri(logoUrl);
    return buffer;
  } catch {
    return null;
  }
}

export async function resolveLogoBuffer(
  userId: string,
  logoUrl: string | null | undefined
): Promise<Buffer | null> {
  const fromDisk = await loadLogoBuffer(userId);
  if (fromDisk) return fromDisk;
  return parseLegacyLogoDataUri(logoUrl);
}
