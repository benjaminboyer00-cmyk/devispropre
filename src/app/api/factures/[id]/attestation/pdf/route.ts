import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateAttestationPdf } from "@/lib/pdf-document";
import { pdfResponse } from "@/lib/pdf-response";
import { requireAuth, handleServiceError } from "@/lib/api-helpers";
import { assertStarterFeature } from "@/lib/plan-features";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    assertStarterFeature(auth.plan, "Attestation individuelle PDF");
  } catch (e) {
    return handleServiceError(e);
  }

  const { id } = await params;
  const facture = await prisma.facture.findFirst({
    where: { id, userId: auth.workspaceUserId, deletedAt: null },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      attestation: true,
    },
  });

  if (!facture?.attestation) {
    return Response.json({ error: "Attestation introuvable" }, { status: 404 });
  }

  const company = await prisma.company.findUnique({ where: { userId: auth.workspaceUserId } });
  const pdf = await generateAttestationPdf(facture.attestation, facture, company);

  return pdfResponse(pdf, `attestation-${facture.attestation.numero}.pdf`);
}
