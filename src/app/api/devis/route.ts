import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  AUTH_DEVIS_WORKFLOW,
  getRequestMeta,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { devisApiListSelect } from "@/lib/prisma-selects";
import { paginationBounds, parsePageParam, totalPages } from "@/lib/pagination";
import { readIdempotencyKey, withIdempotency } from "@/lib/idempotency";
import { createDevisSchema, formatZodError } from "@/lib/schemas/forms";
import { checkRateLimit, devisCreateKey } from "@/lib/rate-limit";
import { createDevis } from "@/lib/services/devis";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
  if (auth.error) return auth.error;

  const page = parsePageParam(request.nextUrl.searchParams.get("page"));
  const { skip, take } = paginationBounds(page);
  const where = { userId: auth.workspaceUserId, deletedAt: null };

  const [devis, total] = await Promise.all([
    prisma.devis.findMany({
      where,
      select: {
        ...devisApiListSelect,
        lignes: { ...devisApiListSelect.lignes, orderBy: { ordre: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.devis.count({ where }),
  ]);

  return Response.json({
    data: devis,
    pagination: { page, pageSize: take, total, totalPages: totalPages(total) },
  });
}

export async function POST(request: NextRequest) {
  try {
    assertMutationSecurity(request);

    const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
    if (auth.error) return auth.error;

    await checkRateLimit(devisCreateKey(auth.workspaceUserId), {
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    const body = createDevisSchema.parse(await request.json());
    const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };
    const idempotencyKey = readIdempotencyKey(request);

    return withIdempotency(auth.workspaceUserId, idempotencyKey, async () => {
      const devis = await createDevis(ctx, {
        clientId: body.clientId,
        lignes: body.lignes,
        notes: body.notes,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      });
      return { status: 201, body: devis };
    });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(formatZodError(e));
    return handleServiceError(e);
  }
}
