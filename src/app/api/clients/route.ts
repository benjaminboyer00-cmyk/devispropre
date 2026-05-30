import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, assertMutationSecurity, getRequestMeta, requireAuth, AUTH_DEVIS_WORKFLOW } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { paginationBounds, parsePageParam, totalPages } from "@/lib/pagination";

const schema = z.object({
  nom: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
  if (auth.error) return auth.error;

  const page = parsePageParam(request.nextUrl.searchParams.get("page"));
  const { skip, take } = paginationBounds(page);
  const where = { userId: auth.workspaceUserId, deletedAt: null };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { nom: "asc" },
      skip,
      take,
    }),
    prisma.client.count({ where }),
  ]);

  return Response.json({
    data: clients,
    pagination: { page, pageSize: take, total, totalPages: totalPages(total) },
  });
}

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth(AUTH_DEVIS_WORKFLOW);
  if (auth.error) return auth.error;

  try {
    const data = schema.parse(await request.json());
    const client = await prisma.client.create({
      data: {
        userId: auth.workspaceUserId,
        nom: data.nom,
        email: data.email || null,
        telephone: data.telephone,
        adresse: data.adresse,
      },
    });

    await logAudit(
      { userId: auth.workspaceUserId, ...getRequestMeta(request) },
      { action: "CREATE", entityType: "client", entityId: client.id, metadata: { nom: client.nom } }
    );

    return Response.json(client, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return apiError("Erreur création client");
  }
}
