import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { transitionDevisStatus } from "@/lib/services/devis";

const schema = z.object({
  status: z.enum(["ACCEPTE", "REFUSE"]),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const { status } = schema.parse(await request.json());
    const ctx = { userId: user.id, ...getRequestMeta(request) };
    const devis = await transitionDevisStatus(ctx, id, status);
    return Response.json(devis);
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}
