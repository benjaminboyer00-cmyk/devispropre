import { NextRequest } from "next/server";
import { assertMutationSecurity, getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { createFactureFromDevis } from "@/lib/services/facture";
import { prisma } from "@/lib/db";
import { factureApiListSelect } from "@/lib/prisma-selects";
import { checkRateLimit, factureCreateKey } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const factures = await prisma.facture.findMany({
    where: { userId: auth.workspaceUserId, deletedAt: null },
    select: factureApiListSelect,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(factures);
}

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await request.json();
  const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

  try {
    await checkRateLimit(factureCreateKey(auth.workspaceUserId), {
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!body.devisId) {
      return Response.json({ error: "devisId requis" }, { status: 400 });
    }
    const facture = await createFactureFromDevis(ctx, body.devisId);
    return Response.json(facture, { status: 201 });
  } catch (e) {
    return handleServiceError(e);
  }
}
