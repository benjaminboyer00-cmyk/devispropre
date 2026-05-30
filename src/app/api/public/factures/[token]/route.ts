import { NextRequest } from "next/server";
import { getTrustedClientIpOrUnknown, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { verifyDocumentIntegrity, buildFacturePayload } from "@/lib/document-hash";
import { companyToLegal } from "@/lib/devis-legal";
import { resolveIssuerCompany } from "@/lib/issuer-snapshot";
import { checkRateLimit } from "@/lib/rate-limit";
import { PUBLIC_DEVIS_LIMITS } from "@/lib/public-api-limits";
import { publicJsonResponse } from "@/lib/public-api-response";
import {
  computeShareLinkExpiresAt,
  isShareLinkExpired,
  isValidShareTokenFormat,
} from "@/lib/share-token";
import { shareTokenLookupWhere } from "@/lib/share-token-storage";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    if (!isValidShareTokenFormat(token)) {
      return publicJsonResponse({ error: "Facture introuvable" }, { status: 404 });
    }

    await checkRateLimit(
      `public-facture-read:${getTrustedClientIpOrUnknown(request)}`,
      PUBLIC_DEVIS_LIMITS.readPerIp
    );

    const facture = await prisma.facture.findFirst({
      where: {
        ...shareTokenLookupWhere(token),
        deletedAt: null,
        status: { in: ["EMISE", "PAYEE"] },
      },
      include: {
        lignes: { orderBy: { ordre: "asc" } },
        client: true,
        user: { include: { company: true } },
      },
    });

    if (!facture) {
      return publicJsonResponse({ error: "Facture introuvable" }, { status: 404 });
    }

    if (
      isShareLinkExpired({
        sentAt: facture.issuedAt,
        validUntil: null,
      })
    ) {
      return publicJsonResponse({ error: "Ce lien de facture a expiré." }, { status: 410 });
    }

    const companyRaw = resolveIssuerCompany(facture.issuerSnapshot, facture.user.company);
    const company = companyRaw ? companyToLegal(companyRaw) : null;
    const payload = buildFacturePayload(facture, facture.user.company);
    const integrityOk = facture.contentHash
      ? verifyDocumentIntegrity(facture.contentHash, payload)
      : false;

    const shareLinkExpiresAt = computeShareLinkExpiresAt({
      sentAt: facture.issuedAt,
      validUntil: null,
    });

    return publicJsonResponse({
      numero: facture.numero,
      status: facture.status,
      totalHT: facture.totalHT,
      totalTVA: facture.totalTVA,
      totalTTC: facture.totalTTC,
      notes: facture.notes,
      issuedAt: facture.issuedAt?.toISOString() ?? null,
      paidAt: facture.paidAt?.toISOString() ?? null,
      dateEcheance: facture.dateEcheance?.toISOString().slice(0, 10) ?? null,
      shareLinkExpiresAt: shareLinkExpiresAt?.toISOString() ?? null,
      integrityOk,
      lockedAt: facture.lockedAt?.toISOString() ?? null,
      client: {
        nom: facture.client.nom,
        adresse: facture.client.adresse,
        telephone: facture.client.telephone,
        email: facture.client.email,
      },
      company,
      lignes: facture.lignes.map((l) => ({
        description: l.description,
        quantite: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        totalHT: l.totalHT,
        tva: l.tva,
      })),
    });
  } catch (e) {
    return handleServiceError(e);
  }
}
