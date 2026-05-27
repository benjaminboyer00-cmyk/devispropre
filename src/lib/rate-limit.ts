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

export function authIpRateLimitKey(ip: string): string {
  return `auth:ip:${ip}`;
}
