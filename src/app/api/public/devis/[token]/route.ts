import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, assertMutationSecurity, getRequestMeta, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { verifyDocumentIntegrity, buildDevisPayload } from "@/lib/document-hash";
import { readIdempotencyKey, withIdempotency } from "@/lib/idempotency";
import { checkRateLimit } from "@/lib/rate-limit";
import { transitionDevisStatusFromPublic } from "@/lib/services/devis";
import { publicJsonResponse } from "@/lib/public-api-response";
import {
  computeShareLinkExpiresAt,
  isShareLinkExpired,
  isValidShareTokenFormat,
} from "@/lib/share-token";
import {
  clientRequiresSignatureOtp,
  consumeDevisSignatureOtp,
  maskClientEmail,
} from "@/lib/devis-signature-otp";

const statusSchema = z
  .object({
    status: z.enum(["ACCEPTE", "REFUSE"]),
    acceptanceText: z.string().min(1).max(200).optional(),
    signatureData: z.string().max(200_000).optional(),
    otpCode: z.string().max(12).optional(),
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
    if (!data.signatureData?.startsWith("data:image/png")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Signature requise.",
        path: ["signatureData"],
      });
    }
  });

type RouteParams = { params: Promise<{ token: string }> };

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  if (!isValidShareTokenFormat(token)) {
    return publicJsonResponse({ error: "Devis introuvable" }, { status: 404 });
  }

  await checkRateLimit(`public-devis-read:${clientIp(request)}`, {
    maxAttempts: 60,
    windowMs: 60 * 60 * 1000,
  });

  const devis = await prisma.devis.findFirst({
    where: { shareToken: token, deletedAt: null },
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
  const clientEmailHint = devis.client.email ? maskClientEmail(devis.client.email) : null;

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
      email: devis.client.email,
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

    const ip = clientIp(request);

    await checkRateLimit(`public-devis:${ip}`, { maxAttempts: 20, windowMs: 60 * 60 * 1000 });

    const { token } = await params;

    if (!isValidShareTokenFormat(token)) {
      return publicJsonResponse({ error: "Devis introuvable ou déjà traité" }, { status: 404 });
    }

    const devis = await prisma.devis.findFirst({
      where: { shareToken: token, deletedAt: null, status: "ENVOYE" },
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

    const { status, acceptanceText, signatureData, otpCode } = statusSchema.parse(
      await request.json()
    );

    if (status === "ACCEPTE" && clientRequiresSignatureOtp(devis.client.email)) {
      if (!otpCode?.trim()) {
        return publicJsonResponse(
          { error: "Code de vérification requis. Demandez-le par email avant de signer." },
          { status: 401 }
        );
      }
      const otpOk = await consumeDevisSignatureOtp(devis.id, otpCode);
      if (!otpOk) {
        return publicJsonResponse(
          { error: "Code invalide ou expiré. Demandez un nouveau code." },
          { status: 401 }
        );
      }
    }

    const ctx = {
      userId: devis.userId,
      ...getRequestMeta(request),
    };
    const idempotencyKey = readIdempotencyKey(request);

    return withIdempotency(devis.userId, idempotencyKey, async () => {
      const updated = await transitionDevisStatusFromPublic(
        ctx,
        devis.id,
        token,
        status,
        status === "ACCEPTE"
          ? { acceptanceText: acceptanceText!.trim(), signatureData: signatureData! }
          : undefined
      );
      return { status: 200, body: { ok: true, status: updated.status } };
    });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}
