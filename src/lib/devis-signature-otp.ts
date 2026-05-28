import { randomInt } from "crypto";
import { sha256 } from "./crypto";
import { prisma } from "./db";
import { sendDevisSignatureOtpEmail } from "./email";
import { AUTH_RESPONSE_MIN_MS, ensureMinimumElapsed } from "./timing-safe";
import { isShareLinkExpired } from "./share-token";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export function maskClientEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf("@");
  if (at <= 0) return "***";
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function clientRequiresSignatureOtp(clientEmail: string | null | undefined): boolean {
  return Boolean(clientEmail?.trim());
}

function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Envoie un code à usage unique à l'email client enregistré sur le devis. */
export async function requestDevisSignatureOtp(params: {
  devisId: string;
  shareToken: string;
  clientEmail: string;
  clientNom: string;
  devisNumero: string;
  companyName: string;
  sentAt: Date | null;
  validUntil: Date | null;
}): Promise<{ sent: boolean; emailHint: string }> {
  const start = Date.now();
  const emailHint = maskClientEmail(params.clientEmail);

  if (
    isShareLinkExpired({
      sentAt: params.sentAt,
      validUntil: params.validUntil,
    })
  ) {
    await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
    return { sent: true, emailHint };
  }

  const recent = await prisma.devisSignatureOtp.findFirst({
    where: {
      devisId: params.devisId,
      usedAt: null,
      expiresAt: { gt: new Date() },
      createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    },
    select: { id: true },
  });

  if (recent) {
    await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
    return { sent: true, emailHint };
  }

  const rawCode = generateOtpCode();
  const codeHash = sha256(rawCode);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.devisSignatureOtp.deleteMany({
    where: { devisId: params.devisId, usedAt: null },
  });

  await prisma.devisSignatureOtp.create({
    data: {
      devisId: params.devisId,
      codeHash,
      expiresAt,
    },
  });

  await sendDevisSignatureOtpEmail({
    to: params.clientEmail.trim(),
    clientNom: params.clientNom,
    devisNumero: params.devisNumero,
    companyName: params.companyName,
    code: rawCode,
    expiresMinutes: OTP_TTL_MS / 60_000,
  });

  await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
  return { sent: true, emailHint };
}

/** Consommation atomique du code OTP (single-use). */
export async function consumeDevisSignatureOtp(devisId: string, rawCode: string): Promise<boolean> {
  const normalized = rawCode.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  const codeHash = sha256(normalized);
  const now = new Date();

  const consumed = await prisma.devisSignatureOtp.updateMany({
    where: {
      devisId,
      codeHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  return consumed.count === 1;
}
