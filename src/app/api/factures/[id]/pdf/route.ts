import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { generateFacturePdf } from "@/lib/pdf-document";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const facture = await prisma.facture.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
  });

  if (!facture) return Response.json({ error: "Facture introuvable" }, { status: 404 });

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  const pdf = await generateFacturePdf(facture, company);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${facture.numero}.pdf"`,
    },
  });
}
