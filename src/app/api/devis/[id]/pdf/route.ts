import { NextRequest } from "next/server";
import { handleServiceError, requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { devisPdfKey, readArchivedPdf } from "@/lib/object-storage";
import { generateDevisPdf } from "@/lib/pdf-document";
import { pdfResponse } from "@/lib/pdf-response";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;
    const devis = await prisma.devis.findFirst({
      where: { id, userId: auth.workspaceUserId, deletedAt: null },
      include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
    });

    if (!devis) return Response.json({ error: "Devis introuvable" }, { status: 404 });

    if (devis.pdfArchivedAt) {
      const archived = await readArchivedPdf(devisPdfKey(auth.workspaceUserId, devis.id));
      if (archived) {
        return pdfResponse(archived, `devis-${devis.numero}.pdf`);
      }
      return Response.json(
        { error: "Archive PDF introuvable — contactez le support." },
        { status: 503 }
      );
    }

    if (devis.status !== "BROUILLON") {
      return Response.json({ error: "PDF non disponible pour ce devis." }, { status: 404 });
    }

    const company = await prisma.company.findUnique({ where: { userId: auth.workspaceUserId } });
    const pdf = await generateDevisPdf(devis, company);
    return pdfResponse(pdf, `devis-${devis.numero}.pdf`);
  } catch (e) {
    return handleServiceError(e);
  }
}
