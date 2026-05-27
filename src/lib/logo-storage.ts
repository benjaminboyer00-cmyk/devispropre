import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const LOGO_DIR = path.join(process.cwd(), "storage", "logos");
export const MAX_LOGO_BYTES = 500_000;

const ALLOWED_MIMES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const DATA_URI_RE = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

export function logoApiPath(userId: string): string {
  return `/api/logos/${userId}`;
}

/** Valide un data URI image et retourne le buffer + extension. */
export function parseLogoDataUri(dataUri: string): { buffer: Buffer; ext: string } {
  const match = DATA_URI_RE.exec(dataUri.trim());
  if (!match) {
    throw new Error("Logo invalide : PNG, JPG ou WebP en base64 uniquement.");
  }

  const mime = match[1];
  const ext = ALLOWED_MIMES[mime];
  if (!ext) throw new Error("Format d'image non autorisé.");

  let buffer: Buffer;
  try {
    buffer = Buffer.from(match[2], "base64");
  } catch {
    throw new Error("Logo base64 invalide.");
  }

  if (buffer.length === 0 || buffer.length > MAX_LOGO_BYTES) {
    throw new Error(`Logo trop volumineux (max ${MAX_LOGO_BYTES / 1000} Ko).`);
  }

  return { buffer, ext };
}

export async function saveLogoFile(userId: string, buffer: Buffer, ext: string): Promise<string> {
  await mkdir(LOGO_DIR, { recursive: true });

  for (const oldExt of ["png", "jpg", "webp"]) {
    await unlink(path.join(LOGO_DIR, `${userId}.${oldExt}`)).catch(() => undefined);
  }

  await writeFile(path.join(LOGO_DIR, `${userId}.${ext}`), buffer);
  return logoApiPath(userId);
}

export async function loadLogoBuffer(userId: string): Promise<Buffer | null> {
  for (const ext of ["png", "jpg", "webp"]) {
    try {
      return await readFile(path.join(LOGO_DIR, `${userId}.${ext}`));
    } catch {
      /* fichier absent */
    }
  }
  return null;
}

/** Compat legacy : data URI encore en base (migration progressive). */
export function parseLegacyLogoDataUri(logoUrl: string | null | undefined): Buffer | null {
  if (!logoUrl?.startsWith("data:image")) return null;
  try {
    const { buffer } = parseLogoDataUri(logoUrl);
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
