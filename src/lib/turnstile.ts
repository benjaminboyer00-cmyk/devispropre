import { env } from "./env";

export class TurnstileError extends Error {
  constructor(message = "Vérification anti-bot échouée.") {
    super(message);
    this.name = "TurnstileError";
  }
}

/** Cloudflare Turnstile — obligatoire en production (validateEnv). */
export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp: string
): Promise<void> {
  if (!env.turnstileSecretKey) return;
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
