import { NextRequest } from "next/server";
import { assertMutationSecurity, getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { createFactureFromDevis } from "@/lib/services/facture";
import { prisma } from "@/lib/db";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const factures = await prisma.facture.findMany({
    where: { userId: user.id, deletedAt: null },
    include: { client: true, attestation: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(factures);
}

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const ctx = { userId: user.id, ...getRequestMeta(request) };

  try {
    if (!body.devisId) {
      return Response.json({ error: "devisId requis" }, { status: 400 });
    }
    const facture = await createFactureFromDevis(ctx, body.devisId);
    return Response.json(facture, { status: 201 });
  } catch (e) {
    return handleServiceError(e);
  }
}
