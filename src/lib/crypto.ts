import { createHash, randomBytes } from "crypto";

/** SHA-256 hex — base de l'inaltérabilité (loi anti-fraude TVA 2018). */
export function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export function generateShareToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateAttestationNumero(userId: string, factureNumero: string): string {
  const seed = `${userId}:${factureNumero}:${Date.now()}`;
  return `ATT-${sha256(seed).slice(0, 12).toUpperCase()}`;
}

/** Canonicalise récursivement pour un hachage déterministe. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
  return `{${pairs.join(",")}}`;
}
