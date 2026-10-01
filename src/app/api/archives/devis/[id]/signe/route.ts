import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { readArchivedPdf, signedDevisPdfKey } from "@/lib/object-storage";
import { pdfResponse } from "@/lib/pdf-response";

type RouteParams = { params: Promise<{ id: string }> };

/** Sert le PDF du devis signé électroniquement (signature + certificat). */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, userId: auth.workspaceUserId, deletedAt: null, signedPdfArchivedAt: { not: null } },
    select: { id: true, numero: true },
  });

  if (!devis) {
    return Response.json({ error: "Devis signé introuvable" }, { status: 404 });
  }

  const archived = await readArchivedPdf(signedDevisPdfKey(auth.workspaceUserId, devis.id));
  if (!archived) {
    return Response.json({ error: "Fichier PDF signé introuvable" }, { status: 404 });
  }

  return pdfResponse(archived, `devis-${devis.numero}-signe.pdf`);
}
