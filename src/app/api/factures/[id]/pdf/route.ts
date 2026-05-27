import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { facturePdfKey, readArchivedPdf } from "@/lib/object-storage";
import { generateFacturePdf } from "@/lib/pdf-document";
import { pdfResponse } from "@/lib/pdf-response";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const facture = await prisma.facture.findFirst({
    where: { id, userId: auth.workspaceUserId, deletedAt: null },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
  });

  if (!facture) return Response.json({ error: "Facture introuvable" }, { status: 404 });

  if (facture.pdfUrl?.startsWith("http")) {
    return Response.redirect(facture.pdfUrl, 307);
  }

  if (facture.pdfArchivedAt) {
    const archived = await readArchivedPdf(facturePdfKey(auth.workspaceUserId, facture.id));
    if (archived) {
      return pdfResponse(archived, `facture-${facture.numero}.pdf`);
    }
  }

  const company = await prisma.company.findUnique({ where: { userId: auth.workspaceUserId } });
  const pdf = await generateFacturePdf(facture, company);
  return pdfResponse(pdf, `facture-${facture.numero}.pdf`);
}
