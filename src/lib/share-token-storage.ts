import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { generateShareToken, sha256 } from "./crypto";
import { env } from "./env";
import { isValidShareTokenFormat } from "./share-token";

const ALGO = "aes-256-gcm";

function encryptionKey(): Buffer {
  return createHash("sha256").update(env.jwtSecret, "utf8").digest();
}

export function hashShareToken(raw: string): string {
  return sha256(raw.trim());
}

export function encryptShareToken(raw: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptShareToken(enc: string | null | undefined): string | null {
  if (!enc) return null;
  try {
    const buf = Buffer.from(enc, "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv(ALGO, encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Émet un token brut (URL) + hash (lookup DB) + chiffré (affichage artisan). */
export function issueShareTokenPair(): { raw: string; hash: string; enc: string } {
  const raw = generateShareToken();
  return { raw, hash: hashShareToken(raw), enc: encryptShareToken(raw) };
}

/** Clause Prisma pour résoudre un token URL (hash ou legacy clair). */
export function shareTokenLookupWhere(rawToken: string) {
  const trimmed = rawToken.trim();
  const hash = hashShareToken(trimmed);
  if (isValidShareTokenFormat(trimmed)) {
    return { OR: [{ shareTokenHash: hash }, { shareTokenHash: trimmed }] };
  }
  return { shareTokenHash: hash };
}

/** Token brut pour construire l’URL côté artisan (déchiffre ou legacy). */
export function resolveShareTokenRaw(record: {
  shareTokenHash: string | null;
  shareTokenEnc?: string | null;
}): string | null {
  const decrypted = decryptShareToken(record.shareTokenEnc);
  if (decrypted) return decrypted;
  if (record.shareTokenHash && isValidShareTokenFormat(record.shareTokenHash)) {
    return record.shareTokenHash;
  }
  return null;
}
