import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getRequestMeta } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { verifyDocumentIntegrity, buildDevisPayload } from "@/lib/document-hash";
import { transitionDevisStatus } from "@/lib/services/devis";

const statusSchema = z.object({
  status: z.enum(["ACCEPTE", "REFUSE"]),
});

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const devis = await prisma.devis.findFirst({
    where: { shareToken: token, deletedAt: null },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      client: true,
      user: { include: { company: true } },
    },
  });

  if (!devis || devis.status === "BROUILLON") {
    return Response.json({ error: "Devis introuvable" }, { status: 404 });
  }

  const company = devis.user.company;
  const payload = buildDevisPayload(devis, company);
  const integrityOk = devis.contentHash
    ? verifyDocumentIntegrity(devis.contentHash, payload)
    : false;

  return Response.json({
    numero: devis.numero,
    status: devis.status,
    totalTTC: devis.totalTTC,
    client: { nom: devis.client.nom },
    company: company ? { raisonSociale: company.raisonSociale } : null,
    integrityOk,
    lockedAt: devis.lockedAt,
    lignes: devis.lignes,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const devis = await prisma.devis.findFirst({
    where: { shareToken: token, deletedAt: null, status: "ENVOYE" },
  });

  if (!devis) {
    return Response.json({ error: "Devis introuvable ou déjà traité" }, { status: 404 });
  }

  try {
    const { status } = statusSchema.parse(await request.json());
    const ctx = {
      userId: devis.userId,
      ...getRequestMeta(request),
    };

    const updated = await transitionDevisStatus(ctx, devis.id, status);
    return Response.json({ ok: true, status: updated.status });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return Response.json({ error: "Erreur" }, { status: 400 });
  }
}
