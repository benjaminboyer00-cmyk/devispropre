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
import { softDeleteDevis, updateDevis } from "@/lib/services/devis";

const ligneSchema = z.object({
  description: z.string().min(1),
  quantite: z.number().positive(),
  prixUnitaireHT: z.number().min(0),
  tva: z.number().min(0).max(100).optional(),
});

const updateSchema = z.object({
  lignes: z.array(ligneSchema).min(1).optional(),
  notes: z.string().optional(),
  validUntil: z.string().datetime().nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
  if (auth.error) return auth.error;

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, userId: auth.workspaceUserId, deletedAt: null },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } }, facture: true },
  });

  if (!devis) return apiError("Devis introuvable", 404);
  return Response.json(devis);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);

  const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body = updateSchema.parse(await request.json());
    const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

    const devis = await updateDevis(ctx, id, {
      lignes: body.lignes,
      notes: body.notes,
      validUntil:
        body.validUntil === undefined
          ? undefined
          : body.validUntil
            ? new Date(body.validUntil)
            : null,
    });

    return Response.json(devis);
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);

  const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
  if (auth.error) return auth.error;

  const { id } = await params;
  const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

  try {
    await softDeleteDevis(ctx, id);
    return Response.json({ ok: true });
  } catch (e) {
    return handleServiceError(e);
  }
}
