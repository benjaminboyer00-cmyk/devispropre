import { NextRequest } from "next/server";
import { assertMutationSecurity, getRequestMeta, handleServiceError, requireAuth } from "@/lib/api-helpers";
import { env } from "@/lib/env";
import { readIdempotencyKey, withIdempotency } from "@/lib/idempotency";
import { checkRateLimit, devisSendKey } from "@/lib/rate-limit";
import { ROUTES } from "@/lib/routes";
import { sendDevis } from "@/lib/services/devis";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    assertMutationSecurity(request);

    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;
    const ctx = { userId: auth.workspaceUserId, ...getRequestMeta(request) };

    await checkRateLimit(devisSendKey(auth.workspaceUserId), {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000,
    });

    const idempotencyKey = readIdempotencyKey(request);

    return withIdempotency(auth.workspaceUserId, idempotencyKey, async () => {
      const result = await sendDevis(ctx, id);
      const { shareTokenRaw, shareSlug, ...devis } = result;
      const shareRef = shareSlug ?? shareTokenRaw;
      const shareUrl = shareRef ? `${env.appUrl}${ROUTES.publicDevis(shareRef)}` : null;
      return { status: 200, body: { ...devis, shareUrl } };
    });
  } catch (e) {
    return handleServiceError(e);
  }
}
