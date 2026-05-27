import { NextRequest } from "next/server";
import { getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { verifyDevisIntegrity } from "@/lib/services/devis";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

  try {
    const result = await verifyDevisIntegrity(ctx, id);
    return Response.json(result);
  } catch (e) {
    return handleServiceError(e);
  }
}
