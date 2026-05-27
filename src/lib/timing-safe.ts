import { timingSafeEqual } from "node:crypto";

/** Uniformise la durée d'une opération (anti-énumération par timing). */
export async function ensureMinimumElapsed(startMs: number, minimumMs: number): Promise<void> {
  const elapsed = Date.now() - startMs;
  if (elapsed < minimumMs) {
    await new Promise((resolve) => setTimeout(resolve, minimumMs - elapsed));
  }
}

export const AUTH_RESPONSE_MIN_MS = 400;

/** Comparaison constant-time pour secrets (Bearer, tokens). */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
