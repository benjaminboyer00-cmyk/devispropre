import { NextRequest } from "next/server";
import { assertMutationSecurity, getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { createFactureFromDevis } from "@/lib/services/facture";
import { prisma } from "@/lib/db";
import { factureApiListSelect } from "@/lib/prisma-selects";
import { paginationBounds, parsePageParam, totalPages } from "@/lib/pagination";
import { readIdempotencyKey, withIdempotency } from "@/lib/idempotency";
import { checkRateLimit, factureCreateKey } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const page = parsePageParam(request.nextUrl.searchParams.get("page"));
  const { skip, take } = paginationBounds(page);
  const where = { userId: auth.workspaceUserId, deletedAt: null };

  const [factures, total] = await Promise.all([
    prisma.facture.findMany({
      where,
      select: factureApiListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.facture.count({ where }),
  ]);

  return Response.json({
    data: factures,
    pagination: { page, pageSize: take, total, totalPages: totalPages(total) },
  });
}

export async function POST(request: NextRequest) {
  try {
    assertMutationSecurity(request);

    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

    await checkRateLimit(factureCreateKey(auth.workspaceUserId), {
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!body.devisId) {
      return Response.json({ error: "devisId requis" }, { status: 400 });
    }

    const idempotencyKey = readIdempotencyKey(request);
    return withIdempotency(auth.workspaceUserId, idempotencyKey, async () => {
      const facture = await createFactureFromDevis(ctx, body.devisId);
      return { status: 201, body: facture };
    });
  } catch (e) {
    return handleServiceError(e);
  }
}
