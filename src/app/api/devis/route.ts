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
import { createDevis } from "@/lib/services/devis";

const ligneSchema = z.object({
  description: z.string().min(1),
  quantite: z.number().positive(),
  prixUnitaireHT: z.number().min(0),
  tva: z.number().min(0).max(100).optional(),
});

const createSchema = z.object({
  clientId: z.string().min(1),
  lignes: z.array(ligneSchema).min(1),
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const devis = await prisma.devis.findMany({
    where: { userId: auth.workspaceUserId, deletedAt: null },
    include: { client: true, lignes: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(devis);
}

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = createSchema.parse(await request.json());
    const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

    const devis = await createDevis(ctx, {
      clientId: body.clientId,
      lignes: body.lignes,
      notes: body.notes,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
    });

    return Response.json(devis, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}
