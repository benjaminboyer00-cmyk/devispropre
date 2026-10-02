import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { generateShareToken, sha256 } from "./crypto";
import { dataEncryptionKey, legacyShareTokenKey } from "./keys";
import { isValidShareTokenFormat } from "./share-token";

const ALGO = "aes-256-gcm";

/** Préfixe des chiffrés produits avec DATA_ENCRYPTION_KEY (sinon : clé legacy dérivée de JWT_SECRET). */
const DEDICATED_KEY_PREFIX = "k2.";

export function isLegacyShareTokenCiphertext(enc: string): boolean {
  return !enc.startsWith(DEDICATED_KEY_PREFIX);
}

function seal(raw: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

function open(enc: string, key: Buffer): string {
  const buf = Buffer.from(enc, "base64url");
  const decipher = createDecipheriv(ALGO, key, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

export function hashShareToken(raw: string): string {
  return sha256(raw.trim());
}

export function encryptShareToken(raw: string): string {
  const key = dataEncryptionKey();
  return key ? `${DEDICATED_KEY_PREFIX}${seal(raw, key)}` : seal(raw, legacyShareTokenKey());
}

export function decryptShareToken(enc: string | null | undefined): string | null {
  if (!enc) return null;
  try {
    if (!isLegacyShareTokenCiphertext(enc)) {
      const key = dataEncryptionKey();
      return key ? open(enc.slice(DEDICATED_KEY_PREFIX.length), key) : null;
    }
    return open(enc, legacyShareTokenKey());
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

/**
 * Re-chiffre avec DATA_ENCRYPTION_KEY les jetons encore chiffrés par la clé legacy (JWT_SECRET).
 * Idempotent ; SQL brut pour ne pas toucher `updatedAt`. Appelé au démarrage (instrumentation).
 */
export async function reencryptLegacyShareTokens(): Promise<number> {
  if (!dataEncryptionKey()) return 0;
  const { prisma } = await import("./db");
  const legacyWhere = {
    shareTokenEnc: { not: null },
    NOT: { shareTokenEnc: { startsWith: DEDICATED_KEY_PREFIX } },
  };
  const select = { id: true, shareTokenEnc: true } as const;
  let migrated = 0;

  for (const row of await prisma.devis.findMany({ where: legacyWhere, select })) {
    const raw = decryptShareToken(row.shareTokenEnc);
    if (!raw) continue;
    migrated += await prisma.$executeRaw`UPDATE "Devis" SET "shareTokenEnc" = ${encryptShareToken(raw)} WHERE "id" = ${row.id} AND "shareTokenEnc" = ${row.shareTokenEnc}`;
  }
  for (const row of await prisma.facture.findMany({ where: legacyWhere, select })) {
    const raw = decryptShareToken(row.shareTokenEnc);
    if (!raw) continue;
    migrated += await prisma.$executeRaw`UPDATE "Facture" SET "shareTokenEnc" = ${encryptShareToken(raw)} WHERE "id" = ${row.id} AND "shareTokenEnc" = ${row.shareTokenEnc}`;
  }

  return migrated;
}
