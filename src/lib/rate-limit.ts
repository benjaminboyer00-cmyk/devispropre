import { prisma } from "./db";

export class RateLimitError extends Error {
  constructor(message = "Trop de tentatives. Réessayez dans quelques minutes.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Rate limit partagé via PostgreSQL — safe multi-workers / redémarrages. */
export async function checkRateLimit(
  key: string,
  { maxAttempts, windowMs }: { maxAttempts: number; windowMs: number }
): Promise<void> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const allowed = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return true;
    }

    if (existing.count >= maxAttempts) {
      return false;
    }

    await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return true;
  });

  if (!allowed) {
    throw new RateLimitError();
  }
}

export function authRateLimitKey(ip: string, email?: string): string {
  return `auth:${ip}:${email?.toLowerCase() ?? "unknown"}`;
}

export function authRegisterEmailKey(ip: string, email: string): string {
  return `auth:register:${ip}:${email.toLowerCase().trim()}`;
}

export function authMagicLinkEmailKey(ip: string, email: string): string {
  return `auth:magic:${ip}:${email.toLowerCase().trim()}`;
}

export function authLoginEmailKey(ip: string, email: string): string {
  return `auth:login:${ip}:${email.toLowerCase().trim()}`;
}

export function authResendVerificationKey(ip: string, email: string): string {
  return `auth:resend-verify:${ip}:${email.toLowerCase().trim()}`;
}

export function authIpRateLimitKey(ip: string): string {
  return `auth:ip:${ip}`;
}

/** Limite par email seul — résiste aux proxys rotatifs. */
export function authEmailOnlyKey(email: string): string {
  return `auth:email-only:${email.toLowerCase().trim()}`;
}

/** Plafond global d'emails magic link (EDoS / facture Resend). */
export function authGlobalMagicLinkKey(): string {
  return "auth:global:magic-link";
}

/** Brute-force mot de passe — limite agressive par IP. */
export function authPasswordLoginIpKey(ip: string): string {
  return `auth:password:ip:${ip}`;
}

export function authPasswordChangeIpKey(ip: string): string {
  return `auth:password-change:ip:${ip}`;
}

export function devisCreateKey(userId: string): string {
  return `devis:create:${userId}`;
}

export function devisClaimDraftKey(userId: string): string {
  return `devis:claim-draft:${userId}`;
}

export function devisSendKey(userId: string): string {
  return `devis:send:${userId}`;
}

export function factureCreateKey(userId: string): string {
  return `facture:create:${userId}`;
}

export function factureIssueKey(userId: string): string {
  return `facture:issue:${userId}`;
}

export function facturePayKey(userId: string): string {
  return `facture:pay:${userId}`;
}

export function factureCancelKey(userId: string): string {
  return `facture:cancel:${userId}`;
}

export function teamInviteKey(userId: string): string {
  return `team:invite:${userId}`;
}

export function supportTicketKey(userId: string): string {
  return `support:ticket:${userId}`;
}

export function settingsLogoKey(userId: string): string {
  return `settings:logo:${userId}`;
}

export function claimGuestDraftKey(userId: string, draftId: string): string {
  return `devis:claim-draft:${userId}:${draftId}`;
}
