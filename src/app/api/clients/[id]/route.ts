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
import { assertClientArchivable, ClientArchiveError } from "@/lib/client-guard";

const schema = z.object({
  nom: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);

  const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const data = schema.parse(await request.json());
    const existing = await prisma.client.findFirst({
      where: { id, userId: auth.workspaceUserId, deletedAt: null },
    });
    if (!existing) return apiError("Client introuvable", 404);

    const client = await prisma.client.updateMany({
      where: { id, userId: auth.workspaceUserId, deletedAt: null },
      data: {
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.telephone !== undefined && { telephone: data.telephone }),
        ...(data.adresse !== undefined && { adresse: data.adresse }),
      },
    });

    if (client.count === 0) return apiError("Client introuvable", 404);

    const updated = await prisma.client.findFirst({ where: { id, userId: auth.workspaceUserId } });
    return Response.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return apiError("Erreur mise à jour client");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);

  const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
  if (auth.error) return auth.error;

  const { id } = await params;

  const existing = await prisma.client.findFirst({
    where: { id, userId: auth.workspaceUserId, deletedAt: null },
  });
  if (!existing) return apiError("Client introuvable", 404);

  try {
    await assertClientArchivable(auth.workspaceUserId, id);
  } catch (e) {
    if (e instanceof ClientArchiveError) return apiError(e.message, 409);
    return handleServiceError(e);
  }

  await prisma.client.updateMany({
    where: { id, userId: auth.workspaceUserId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  return Response.json({ ok: true });
}
