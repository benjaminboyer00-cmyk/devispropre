import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, assertMutationSecurity, getRequestMeta, getTrustedClientIpOrUnknown, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { verifyDocumentIntegrity, buildDevisPayload } from "@/lib/document-hash";
import { readIdempotencyKey, withIdempotency } from "@/lib/idempotency";
import { checkRateLimit } from "@/lib/rate-limit";
import { PUBLIC_DEVIS_LIMITS } from "@/lib/public-api-limits";
import { transitionDevisStatusFromPublic } from "@/lib/services/devis";
import { publicJsonResponse } from "@/lib/public-api-response";
import {
  computeShareLinkExpiresAt,
  isShareLinkExpired,
} from "@/lib/share-token";
import {
  clientRequiresSignatureOtp,
  maskClientEmail,
  normalizeSignerEmail,
  verifyDevisSignatureOtp,
} from "@/lib/devis-signature-otp";
import { SignatureError } from "@/lib/errors";
import { isValidPublicShareRef, publicShareLookupWhere } from "@/lib/share-slug";
import { validateClientSignatureDataUri } from "@/lib/signature-payload";

const statusSchema = z
  .object({
    status: z.enum(["ACCEPTE", "REFUSE"]),
    acceptanceText: z.string().min(1).max(200).optional(),
    signatureData: z.string().max(102_400).optional(),
    otpCode: z.string().max(12).optional(),
    signerName: z.string().max(120).optional(),
    retractationInfoAcknowledged: z.boolean().optional(),
    earlyExecutionRequested: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "ACCEPTE") return;
    if (!data.acceptanceText?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mention « Bon pour accord » requise.",
        path: ["acceptanceText"],
      });
    }
    if (!data.signatureData || !validateClientSignatureDataUri(data.signatureData)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Signature PNG requise (max 100 Ko).",
        path: ["signatureData"],
      });
    }
    if (!data.signerName || data.signerName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nom et prénom du signataire requis.",
        path: ["signerName"],
      });
    }
    if (!data.otpCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Code de vérification reçu par e-mail requis.",
        path: ["otpCode"],
      });
    }
    if (data.retractationInfoAcknowledged !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirmez avoir pris connaissance des informations sur le droit de rétractation.",
        path: ["retractationInfoAcknowledged"],
      });
    }
  });

const OTP_ERRORS: Record<"invalid" | "locked" | "expired", string> = {
  invalid: "Code de vérification incorrect.",
  locked: "Trop de tentatives — demandez un nouveau code.",
  expired: "Code expiré ou déjà utilisé — demandez un nouveau code.",
};

type RouteParams = { params: Promise<{ token: string }> };

/** Vérifie le code OTP (identification du signataire) et construit les données de preuve. */
async function verifySigner(
  devis: { id: string; client: { email: string | null } },
  body: z.infer<typeof statusSchema>
): Promise<Parameters<typeof transitionDevisStatusFromPublic>[4]> {
  if (body.status !== "ACCEPTE") return undefined;

  await checkRateLimit(`public-devis-otp-verify:${devis.id}`, PUBLIC_DEVIS_LIMITS.otpVerifyPerDevis);
  const otp = await verifyDevisSignatureOtp(devis.id, body.otpCode!);
  if (otp.status !== "ok" || !otp.email || !otp.sentAt) {
    const key = otp.status === "ok" ? "expired" : otp.status;
    throw new SignatureError(OTP_ERRORS[key], key === "locked" ? 429 : 400);
  }

  const recordedEmail = normalizeSignerEmail(devis.client.email);
  return {
    acceptanceText: body.acceptanceText!.trim(),
    signatureData: body.signatureData!,
    signerName: body.signerName!.trim().replace(/\s+/g, " "),
    signerEmail: otp.email,
    signerEmailSource: recordedEmail === otp.email ? "client_record" : "declared_by_signer",
    otpSentAt: otp.sentAt,
    otpVerifiedAt: new Date(),
    retractationInfoAcknowledged: true,
    earlyExecutionRequested: body.earlyExecutionRequested === true,
  };
}


export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  if (!isValidPublicShareRef(token)) {
    return publicJsonResponse({ error: "Devis introuvable" }, { status: 404 });
  }

  await checkRateLimit(`public-devis-read:${getTrustedClientIpOrUnknown(request)}`, PUBLIC_DEVIS_LIMITS.readPerIp);

  const devis = await prisma.devis.findFirst({
    where: { ...publicShareLookupWhere(token), deletedAt: null },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      client: true,
      user: { include: { company: true } },
    },
  });

  if (!devis || devis.status === "BROUILLON") {
    return publicJsonResponse({ error: "Devis introuvable" }, { status: 404 });
  }

  const company = devis.user.company;
  const payload = buildDevisPayload(devis, company);
  const integrityOk = devis.contentHash
    ? verifyDocumentIntegrity(devis.contentHash, payload)
    : false;

  const linkExpired = isShareLinkExpired({
    sentAt: devis.sentAt,
    validUntil: devis.validUntil,
  });
  const shareLinkExpiresAt = computeShareLinkExpiresAt({
    sentAt: devis.sentAt,
    validUntil: devis.validUntil,
  });
  const canAccept = devis.status === "ENVOYE" && !linkExpired;
  const signatureOtpRequired = clientRequiresSignatureOtp(devis.client.email);
  const recordedEmail = normalizeSignerEmail(devis.client.email);
  const clientEmailHint = recordedEmail ? maskClientEmail(recordedEmail) : null;

  return publicJsonResponse({
    numero: devis.numero,
    status: devis.status,
    totalHT: devis.totalHT,
    totalTVA: devis.totalTVA,
    totalTTC: devis.totalTTC,
    validUntil: devis.validUntil?.toISOString().slice(0, 10) ?? null,
    shareLinkExpiresAt: shareLinkExpiresAt?.toISOString() ?? null,
    linkExpired,
    canAccept,
    signatureOtpRequired,
    clientEmailHint,
    notes: devis.notes,
    createdAt: devis.createdAt.toISOString(),
    client: {
      nom: devis.client.nom,
      adresse: devis.client.adresse,
      telephone: devis.client.telephone,
    },
    company: company
      ? {
          raisonSociale: company.raisonSociale,
          siret: company.siret,
          adresse: company.adresse,
          codePostal: company.codePostal,
          ville: company.ville,
          tvaApplicable: company.tvaApplicable,
          tvaIntracom: company.tvaIntracom,
          rcs: company.rcs,
          capitalSocial: company.capitalSocial,
          telephone: company.telephone,
          email: company.email,
          assurances: company.assurances,
          assuranceDecennaleAssureur: company.assuranceDecennaleAssureur,
          assuranceDecennaleContrat: company.assuranceDecennaleContrat,
          assuranceDecennaleCouverture: company.assuranceDecennaleCouverture,
          activiteBtp: company.activiteBtp,
        }
      : null,
    integrityOk,
    lockedAt: devis.lockedAt,
    acceptedAt: devis.acceptedAt?.toISOString() ?? null,
    clientAcceptanceText: devis.clientAcceptanceText,
    clientSignatureData: devis.clientSignatureData,
    signerName: devis.signerName,
    signatureEvidenceHash: devis.signatureEvidenceHash,
    hasSignedPdf: Boolean(devis.signedPdfArchivedAt),
    lignes: devis.lignes.map((l) => ({
      description: l.description,
      quantite: l.quantite,
      prixUnitaireHT: l.prixUnitaireHT,
      totalHT: l.totalHT,
      tva: l.tva,
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    assertMutationSecurity(request);

    const ip = getTrustedClientIpOrUnknown(request);

    await checkRateLimit(`public-devis:${ip}`, PUBLIC_DEVIS_LIMITS.signPerIp);

    const { token } = await params;

    if (!isValidPublicShareRef(token)) {
      return publicJsonResponse({ error: "Devis introuvable ou déjà traité" }, { status: 404 });
    }

    const devis = await prisma.devis.findFirst({
      where: { ...publicShareLookupWhere(token), deletedAt: null, status: "ENVOYE" },
      include: { client: true },
    });

    if (!devis) {
      return publicJsonResponse({ error: "Devis introuvable ou déjà traité" }, { status: 404 });
    }

    if (
      isShareLinkExpired({
        sentAt: devis.sentAt,
        validUntil: devis.validUntil,
      })
    ) {
      return publicJsonResponse(
        { error: "Ce lien de signature a expiré. Demandez un nouveau devis à votre artisan." },
        { status: 410 }
      );
    }

    const body = statusSchema.parse(await request.json());
    const { status } = body;

    const ctx = {
      userId: devis.userId,
      ...getRequestMeta(request),
    };
    const idempotencyKey = readIdempotencyKey(request);

    return await withIdempotency(devis.userId, idempotencyKey, async () => {
      // Dans le handler idempotent : un rejeu du même clic renvoie la réponse en cache
      // au lieu d'échouer sur un code OTP déjà consommé.
      const acceptance = await verifySigner(devis, body);
      const updated = await transitionDevisStatusFromPublic(
        ctx,
        devis.id,
        token,
        status,
        acceptance
      );
      return { status: 200, body: { ok: true, status: updated.status } };
    });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.issues[0]?.message ?? "Requête invalide");
    return handleServiceError(e);
  }
}
