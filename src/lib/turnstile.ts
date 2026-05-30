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

const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const IPV6_RE = /^[0-9a-f:]+$/i;

function isValidClientIp(ip: string | null | undefined): ip is string {
  if (!ip || ip === "unknown") return false;
  if (IPV4_RE.test(ip)) return true;
  return ip.includes(":") && IPV6_RE.test(ip);
}

type TurnstileVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

function turnstileErrorMessage(codes: string[] | undefined): string {
  if (codes?.includes("hostname-mismatch")) {
    return "Vérification anti-bot : domaine non autorisé (ajoutez devispropre.com dans Cloudflare Turnstile).";
  }
  if (codes?.includes("invalid-input-secret")) {
    return "Vérification anti-bot : clé secrète Turnstile invalide.";
  }
  if (codes?.includes("timeout-or-duplicate")) {
    return "Vérification anti-bot expirée — réessayez.";
  }
  return "Vérification anti-bot échouée.";
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
  });

  if (isValidClientIp(remoteIp)) {
    body.set("remoteip", remoteIp);
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as TurnstileVerifyResponse;
  if (data.success) return;

  if (process.env.NODE_ENV === "production") {
    console.warn("[turnstile] siteverify failed", data["error-codes"] ?? "unknown");
  }

  throw new TurnstileError(turnstileErrorMessage(data["error-codes"]));
}
