import { createHmac, randomInt } from "crypto";
import { sha256 } from "./crypto";
import { deriveServerSubkey } from "./keys";
import { timingSafeEqualStrings } from "./timing-safe";
import { prisma } from "./db";
import { sendDevisSignatureOtpEmail } from "./email";
import { AUTH_RESPONSE_MIN_MS, ensureMinimumElapsed } from "./timing-safe";
import { isShareLinkExpired } from "./share-token";
import { SignatureError } from "./errors";

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

/**
 * OTP e-mail obligatoire pour toute signature en ligne : c'est lui qui permet d'identifier
 * le signataire (C. civ. art. 1367). Sans OTP, n'importe quel détenteur du lien pourrait signer.
 */
export function clientRequiresSignatureOtp(_clientEmail?: string | null): boolean {
  return true;
}

/**
 * Signature en ligne toujours possible : si l'artisan n'a pas renseigné d'e-mail client,
 * le signataire déclare le sien (il recevra le code puis la copie du devis signé).
 */
export function clientCanSignOnline(_clientEmail?: string | null): boolean {
  return true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeSignerEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized || normalized.length > 254 || !EMAIL_RE.test(normalized)) return null;
  return normalized;
}

/**
 * E-mail de destination du code : celui de la fiche client en priorité (non modifiable
 * par le signataire), sinon celui déclaré sur la page de signature.
 */
export function resolveSignerEmail(
  clientEmail: string | null | undefined,
  declaredEmail: string | null | undefined
): { email: string; source: "client_record" | "declared_by_signer" } | null {
  const recorded = normalizeSignerEmail(clientEmail);
  if (recorded) return { email: recorded, source: "client_record" };
  const declared = normalizeSignerEmail(declaredEmail);
  if (declared) return { email: declared, source: "declared_by_signer" };
  return null;
}

const OTP_HMAC_PREFIX = "h1:";

/**
 * Empreinte du code : HMAC avec une sous-clé serveur, liée au devis. Un SHA-256 nu d'un code
 * à 6 chiffres se renverse en 10^6 essais si la base fuit ; sans la clé, c'est impossible.
 */
export function hashOtpCode(devisId: string, code: string): string {
  const mac = createHmac("sha256", deriveServerSubkey("devis-signature-otp/v1"))
    .update(`${devisId}:${code}`)
    .digest("hex");
  return `${OTP_HMAC_PREFIX}${mac}`;
}

/** Compare en temps constant ; accepte encore l'ancien format SHA-256 (codes émis avant migration, TTL 10 min). */
export function otpCodeMatches(stored: string, devisId: string, code: string): boolean {
  const expected = stored.startsWith(OTP_HMAC_PREFIX) ? hashOtpCode(devisId, code) : sha256(code);
  return timingSafeEqualStrings(expected, stored);
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
  const codeHash = hashOtpCode(params.devisId, rawCode);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.devisSignatureOtp.deleteMany({
    where: { devisId: params.devisId, usedAt: null },
  });

  await prisma.devisSignatureOtp.create({
    data: {
      devisId: params.devisId,
      codeHash,
      email: params.clientEmail.trim().toLowerCase(),
      expiresAt,
      attempts: 0,
    },
  });

  const delivery = await sendDevisSignatureOtpEmail({
    to: params.clientEmail.trim(),
    clientNom: params.clientNom,
    devisNumero: params.devisNumero,
    companyName: params.companyName,
    code: rawCode,
    expiresMinutes: OTP_TTL_MS / 60_000,
  });

  if (!delivery.sent) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dev] Code de signature devis ${params.devisNumero} → ${params.clientEmail} : ${rawCode}`);
    } else {
      await prisma.devisSignatureOtp.deleteMany({ where: { devisId: params.devisId, usedAt: null } });
      console.error("[signature-otp] envoi impossible", delivery.reason);
      throw new SignatureError(
        "Impossible d'envoyer le code de signature pour le moment. Réessayez dans quelques minutes.",
        503
      );
    }
  }

  await ensureMinimumElapsed(start, AUTH_RESPONSE_MIN_MS);
  return { sent: true, emailHint };
}

export interface OtpVerifyOutcome {
  status: OtpVerifyResult;
  /** E-mail auquel le code validé avait été envoyé (preuve de contrôle de la boîte). */
  email: string | null;
  sentAt: Date | null;
}

/** Vérifie et consomme le OTP — compteur attempts, verrouillage après 3 échecs. */
export async function verifyDevisSignatureOtp(
  devisId: string,
  rawCode: string
): Promise<OtpVerifyOutcome> {
  const normalized = rawCode.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return { status: "invalid", email: null, sentAt: null };

  const now = new Date();

  return prisma.$transaction(async (tx): Promise<OtpVerifyOutcome> => {
    const active = await tx.devisSignatureOtp.findFirst({
      where: { devisId, usedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });

    if (!active) return { status: "expired", email: null, sentAt: null };

    if (active.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await tx.devisSignatureOtp.update({
        where: { id: active.id },
        data: { usedAt: now },
      });
      return { status: "locked", email: null, sentAt: null };
    }

    if (!otpCodeMatches(active.codeHash, devisId, normalized)) {
      const attempts = active.attempts + 1;
      await tx.devisSignatureOtp.update({
        where: { id: active.id },
        data: {
          attempts,
          ...(attempts >= OTP_MAX_VERIFY_ATTEMPTS ? { usedAt: now } : {}),
        },
      });
      return {
        status: attempts >= OTP_MAX_VERIFY_ATTEMPTS ? "locked" : "invalid",
        email: null,
        sentAt: null,
      };
    }

    await tx.devisSignatureOtp.update({
      where: { id: active.id },
      data: { usedAt: now },
    });
    return { status: "ok", email: active.email, sentAt: active.createdAt };
  });
}
