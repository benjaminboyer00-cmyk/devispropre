import { env } from "./env";

export class TurnstileError extends Error {
  constructor(message = "Vérification anti-bot échouée.") {
    super(message);
    this.name = "TurnstileError";
  }
}

/** Turnstile actif uniquement si clé secrète ET clé site publique sont configurées. */
export function isTurnstileEnforced(): boolean {
  return Boolean(env.turnstileSecretKey && env.turnstileSiteKey);
}

/** Cloudflare Turnstile — obligatoire en production si les deux clés sont présentes. */
export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp: string
): Promise<void> {
  if (!isTurnstileEnforced()) return;
  if (!token?.trim()) throw new TurnstileError();

  const body = new URLSearchParams({
    secret: env.turnstileSecretKey,
    response: token,
    remoteip: remoteIp,
  });

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as { success?: boolean };
  if (!data.success) throw new TurnstileError();
}
