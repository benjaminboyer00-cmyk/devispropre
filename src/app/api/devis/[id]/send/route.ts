import { NextRequest } from "next/server";
import { assertMutationSecurity, getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { sendDevis } from "@/lib/services/devis";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

  try {
    const devis = await sendDevis(ctx, id);
    return Response.json(devis);
  } catch (e) {
    return handleServiceError(e);
  }
}
