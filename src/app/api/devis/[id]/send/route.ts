import { NextRequest } from "next/server";
import { getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { sendDevis } from "@/lib/services/devis";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const ctx = { userId: user.id, ...getRequestMeta(request) };

  try {
    const devis = await sendDevis(ctx, id);
    return Response.json(devis);
  } catch (e) {
    return handleServiceError(e);
  }
}
