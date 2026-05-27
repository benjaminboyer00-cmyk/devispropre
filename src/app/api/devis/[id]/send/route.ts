import { NextRequest } from "next/server";
import { assertMutationSecurity, getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { checkRateLimit, devisSendKey } from "@/lib/rate-limit";
import { sendDevis } from "@/lib/services/devis";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  assertMutationSecurity(request);
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

  try {
    await checkRateLimit(devisSendKey(auth.workspaceUserId), {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000,
    });

    const devis = await sendDevis(ctx, id);
    return Response.json(devis);
  } catch (e) {
    return handleServiceError(e);
  }
}
