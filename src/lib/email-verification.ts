import { generateShareToken, sha256 } from "./crypto";
import { prisma } from "./db";
import { env } from "./env";
import { sendEmailVerificationEmail } from "./email";
import { AUTH_RESPONSE_MIN_MS, ensureMinimumElapsed } from "./timing-safe";

const TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function sendEmailVerification(userId: string, email: string, name: string): Promise<void> {
  const recent = await prisma.magicLinkToken.findFirst({
    where: {
      userId,
      purpose: "EMAIL_VERIFICATION",
      usedAt: null,
      expiresAt: { gt: new Date() },
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    select: { id: true },
  });
  if (recent) return;

  const rawToken = generateShareToken();
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + TTL_MS);

  await prisma.magicLinkToken.deleteMany({
    where: { userId, purpose: "EMAIL_VERIFICATION", usedAt: null },
  });

  await prisma.magicLinkToken.create({
    data: { userId, tokenHash, purpose: "EMAIL_VERIFICATION", expiresAt },
  });

  const verifyUrl = `${env.appUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  await sendEmailVerificationEmail({ to: email, name, verifyUrl });
}

export async function requestEmailVerification(email: string): Promise<void> {
  const start = Date.now();
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), deletedAt: null },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });

  if (!user || user.emailVerifiedAt) {
    await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
    return;
  }

  await sendEmailVerification(user.id, user.email, user.name);
  await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
}

export async function consumeEmailVerification(rawToken: string): Promise<string | null> {
  const tokenHash = sha256(rawToken.trim());
  const now = new Date();

  const consumed = await prisma.magicLinkToken.updateMany({
    where: {
      tokenHash,
      purpose: "EMAIL_VERIFICATION",
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  if (consumed.count === 0) return null;

  const record = await prisma.magicLinkToken.findFirst({
    where: { tokenHash },
    select: { userId: true },
  });

  if (!record) return null;

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: now },
  });

  return record.userId;
}
