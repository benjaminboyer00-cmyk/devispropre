import { createHash, hkdfSync } from "crypto";
import { env } from "./env";

/**
 * Clé de chiffrement dédiée (AES-256-GCM) — DATA_ENCRYPTION_KEY, 32 octets en hex (64 car.)
 * ou base64. Indépendante de JWT_SECRET : on peut faire tourner l'une sans casser l'autre.
 * Générer : openssl rand -hex 32
 */
export function parseDataEncryptionKey(value: string | undefined): Buffer | null {
  const raw = value?.trim();
  if (!raw) return null;
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY invalide : 32 octets attendus (openssl rand -hex 32).");
  }
  return key;
}

export function dataEncryptionKey(): Buffer | null {
  return parseDataEncryptionKey(process.env.DATA_ENCRYPTION_KEY);
}

/** Ancienne clé des jetons de partage (dérivée de JWT_SECRET) — déchiffrement legacy uniquement. */
export function legacyShareTokenKey(): Buffer {
  return createHash("sha256").update(env.jwtSecret, "utf8").digest();
}

/** Sous-clé HKDF du secret serveur, séparée par usage (`info`). */
export function deriveServerSubkey(info: string): Buffer {
  return Buffer.from(hkdfSync("sha256", env.jwtSecret, "devispropre", info, 32));
}
