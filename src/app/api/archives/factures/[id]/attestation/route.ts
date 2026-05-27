import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { attestationPdfKey, readArchivedPdf } from "@/lib/object-storage";
import { pdfResponse } from "@/lib/pdf-response";

type RouteParams = { params: Promise<{ id: string }> };

/** Sert l'attestation PDF archivée à l'émission — document figé conformité TVA. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const attestation = await prisma.attestation.findFirst({
    where: {
      factureId: id,
      userId: auth.workspaceUserId,
      pdfArchivedAt: { not: null },
    },
    include: { facture: { select: { numero: true } } },
  });

  if (!attestation) {
    return Response.json({ error: "Archive attestation introuvable" }, { status: 404 });
  }

  const archived = await readArchivedPdf(attestationPdfKey(auth.workspaceUserId, id));
  if (!archived) {
    return Response.json({ error: "Fichier attestation archivé introuvable" }, { status: 503 });
  }

  return pdfResponse(archived, `attestation-${attestation.numero}.pdf`);
}
