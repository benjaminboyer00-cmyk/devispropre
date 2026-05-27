import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyDocumentIntegrity, buildFacturePayload } from "@/lib/document-hash";
import { publicJsonResponse } from "@/lib/public-api-response";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const facture = await prisma.facture.findFirst({
    where: {
      shareToken: token,
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

  const company = facture.user.company;
  const payload = buildFacturePayload(facture, company);
  const integrityOk = facture.contentHash
    ? verifyDocumentIntegrity(facture.contentHash, payload)
    : false;

  return publicJsonResponse({
    numero: facture.numero,
    status: facture.status,
    totalTTC: facture.totalTTC,
    issuedAt: facture.issuedAt,
    paidAt: facture.paidAt,
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
}
