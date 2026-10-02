import { NextRequest } from "next/server";
import { getRequestMeta, requireAuth } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { readArchivedPdf, signedDevisPdfKey } from "@/lib/object-storage";
import { pdfResponse } from "@/lib/pdf-response";

type RouteParams = { params: Promise<{ id: string }> };

/** Sert le PDF du devis signé électroniquement (signature + certificat). */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

  // Toute consultation d'un élément de preuve est tracée dans le journal chaîné.
  await logAudit(
    { userId: auth.workspaceUserId, actorUserId: auth.user.id, ...getRequestMeta(request) },
    {
      action: "EXPORT_PROOF",
      entityType: "Devis",
      entityId: devis.id,
      devisId: devis.id,
      metadata: { artifact: "signed_pdf" },
    }
  );

  return pdfResponse(archived, `devis-${devis.numero}-signe.pdf`);
}
