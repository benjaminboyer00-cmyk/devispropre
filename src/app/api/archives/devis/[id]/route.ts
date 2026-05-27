import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { devisPdfKey, readArchivedPdf } from "@/lib/object-storage";
import { pdfResponse } from "@/lib/pdf-response";

type RouteParams = { params: Promise<{ id: string }> };

/** Sert le PDF archivé figé à l'envoi — conformité conservation légale. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, userId: auth.workspaceUserId, deletedAt: null, pdfArchivedAt: { not: null } },
    select: { id: true, numero: true, pdfUrl: true },
  });

  if (!devis) {
    return Response.json({ error: "Archive PDF introuvable" }, { status: 404 });
  }

  const archived = await readArchivedPdf(devisPdfKey(auth.workspaceUserId, devis.id));
  if (!archived) {
    return Response.json({ error: "Fichier PDF archivé introuvable" }, { status: 404 });
  }

  return pdfResponse(archived, `devis-${devis.numero}.pdf`);
}
