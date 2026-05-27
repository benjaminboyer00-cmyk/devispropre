import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, assertMutationSecurity, getRequestMeta, requireAuth } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

const schema = z.object({
  nom: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
});

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const clients = await prisma.client.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { nom: "asc" },
  });

  return Response.json(clients);
}

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const data = schema.parse(await request.json());
    const client = await prisma.client.create({
      data: {
        userId: user.id,
        nom: data.nom,
        email: data.email || null,
        telephone: data.telephone,
        adresse: data.adresse,
      },
    });

    await logAudit(
      { userId: user.id, ...getRequestMeta(request) },
      { action: "CREATE", entityType: "client", entityId: client.id, metadata: { nom: client.nom } }
    );

    return Response.json(client, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return apiError("Erreur création client");
  }
}
