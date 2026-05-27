import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { renderDevisHtml } from "@/lib/pdf";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
  });

  if (!devis) return Response.json({ error: "Devis introuvable" }, { status: 404 });

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  const html = renderDevisHtml(devis, company);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="devis-${devis.numero}.html"`,
    },
  });
}
