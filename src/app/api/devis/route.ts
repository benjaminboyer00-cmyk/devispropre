import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getRequestMeta,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { devisApiListSelect } from "@/lib/prisma-selects";
import { createDevisSchema, formatZodError } from "@/lib/schemas/forms";
import { checkRateLimit, devisCreateKey } from "@/lib/rate-limit";
import { createDevis } from "@/lib/services/devis";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const devis = await prisma.devis.findMany({
    where: { userId: auth.workspaceUserId, deletedAt: null },
    select: {
      ...devisApiListSelect,
      lignes: { ...devisApiListSelect.lignes, orderBy: { ordre: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(devis);
}

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    await checkRateLimit(devisCreateKey(auth.workspaceUserId), {
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    const body = createDevisSchema.parse(await request.json());
    const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

    const devis = await createDevis(ctx, {
      clientId: body.clientId,
      lignes: body.lignes,
      notes: body.notes,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
    });

    return Response.json(devis, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(formatZodError(e));
    return handleServiceError(e);
  }
}
