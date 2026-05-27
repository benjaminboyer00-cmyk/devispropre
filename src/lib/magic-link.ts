import { generateShareToken, sha256 } from "./crypto";
import { prisma } from "./db";
import { env } from "./env";
import { sendMagicLinkEmail } from "./email";
import type { SessionUser } from "./auth";
import { AUTH_RESPONSE_MIN_MS, ensureMinimumElapsed } from "./timing-safe";

const TTL_MS = 15 * 60 * 1000;
/** Ne pas renvoyer d'email si un token valide a déjà été émis récemment (coût Resend). */
const RESEND_COOLDOWN_MS = 60 * 1000;

/** Envoie un lien de connexion si le compte existe (réponse uniforme côté API). */
export async function requestMagicLink(email: string): Promise<void> {
  const start = Date.now();

  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), deletedAt: null },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
    return;
  }

  const recentToken = await prisma.magicLinkToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    select: { id: true },
  });

  if (recentToken) {
    await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
    return;
  }

  const rawToken = generateShareToken();
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + TTL_MS);

  await prisma.magicLinkToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  await prisma.magicLinkToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const verifyUrl = `${env.appUrl}/api/auth/magic-link/verify?token=${encodeURIComponent(rawToken)}`;
  await sendMagicLinkEmail({
    to: user.email,
    name: user.name,
    verifyUrl,
  });

  await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
}

export async function consumeMagicLink(rawToken: string): Promise<SessionUser | null> {
  const tokenHash = sha256(rawToken.trim());
  const record = await prisma.magicLinkToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: { id: true, email: true, name: true, plan: true, deletedAt: true },
      },
    },
  });

  if (!record?.user || record.user.deletedAt) return null;

  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return {
    id: record.user.id,
    email: record.user.email,
    name: record.user.name,
    plan: record.user.plan,
  };
}
