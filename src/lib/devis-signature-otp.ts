import { randomInt } from "crypto";
import { sha256 } from "./crypto";
import { prisma } from "./db";
import { sendDevisSignatureOtpEmail } from "./email";
import { AUTH_RESPONSE_MIN_MS, ensureMinimumElapsed } from "./timing-safe";
import { isShareLinkExpired } from "./share-token";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

/** Nombre max de tentatives avant invalidation du code (anti-bruteforce). */
export const OTP_MAX_VERIFY_ATTEMPTS = 3;

export type OtpVerifyResult = "ok" | "invalid" | "locked" | "expired";

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
  return true;
}

/** Signature en ligne impossible sans email client (OTP requis). */
export function clientCanSignOnline(clientEmail: string | null | undefined): boolean {
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
      attempts: 0,
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

/** Vérifie et consomme le OTP — compteur attempts, verrouillage après 3 échecs. */
export async function verifyDevisSignatureOtp(
  devisId: string,
  rawCode: string
): Promise<OtpVerifyResult> {
  const normalized = rawCode.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return "invalid";

  const codeHash = sha256(normalized);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const active = await tx.devisSignatureOtp.findFirst({
      where: { devisId, usedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });

    if (!active) return "expired";

    if (active.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await tx.devisSignatureOtp.update({
        where: { id: active.id },
        data: { usedAt: now },
      });
      return "locked";
    }

    if (active.codeHash !== codeHash) {
      const attempts = active.attempts + 1;
      await tx.devisSignatureOtp.update({
        where: { id: active.id },
        data: {
          attempts,
          ...(attempts >= OTP_MAX_VERIFY_ATTEMPTS ? { usedAt: now } : {}),
        },
      });
      return attempts >= OTP_MAX_VERIFY_ATTEMPTS ? "locked" : "invalid";
    }

    await tx.devisSignatureOtp.update({
      where: { id: active.id },
      data: { usedAt: now },
    });
    return "ok";
  });
}

/** @deprecated Utiliser verifyDevisSignatureOtp */
export async function consumeDevisSignatureOtp(devisId: string, rawCode: string): Promise<boolean> {
  return (await verifyDevisSignatureOtp(devisId, rawCode)) === "ok";
}
