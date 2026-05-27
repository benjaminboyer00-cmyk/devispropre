import { NextRequest } from "next/server";
import {
  assertMutationSecurity,
  getRequestMeta,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { cancelFacture, issueFacture, markFacturePaid } from "@/lib/services/facture";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const facture = await prisma.facture.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      attestation: true,
    },
  });

  if (!facture) return Response.json({ error: "Facture introuvable" }, { status: 404 });
  return Response.json(facture);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);

  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const ctx = { userId: user.id, ...getRequestMeta(request) };
  const body = await request.json().catch(() => ({}));

  try {
    if (body.action === "pay") {
      const facture = await markFacturePaid(ctx, id);
      return Response.json(facture);
    }
    if (body.action === "cancel") {
      const facture = await cancelFacture(ctx, id);
      return Response.json(facture);
    }

    const facture = await issueFacture(ctx, id);
    return Response.json(facture);
  } catch (e) {
    return handleServiceError(e);
  }
}
