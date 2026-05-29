import { NextRequest } from "next/server";
import { getTrustedClientIpOrUnknown, handleServiceError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { verifyDocumentIntegrity, buildFacturePayload } from "@/lib/document-hash";
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

    const company = resolveIssuerCompany(facture.issuerSnapshot, facture.user.company);
    const payload = buildFacturePayload(facture, company);
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
      totalTTC: facture.totalTTC,
      issuedAt: facture.issuedAt,
      paidAt: facture.paidAt,
      shareLinkExpiresAt: shareLinkExpiresAt?.toISOString() ?? null,
      client: { nom: facture.client.nom },
      company: company ? { raisonSociale: company.raisonSociale } : null,
      integrityOk,
      lockedAt: facture.lockedAt,
      lignes: facture.lignes.map((l) => ({
        description: l.description,
        quantite: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        totalHT: l.totalHT,
      })),
    });
  } catch (e) {
    return handleServiceError(e);
  }
}
