import { NextRequest } from "next/server";
import {
  assertMutationSecurity,
  buildServiceContext,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { checkRateLimit, devisClaimDraftKey } from "@/lib/rate-limit";
import { guestDevisDraftSchema } from "@/lib/schemas/forms";
import { claimGuestDraftAsDevis } from "@/lib/services/devis";

/** Rattache un brouillon invité au compte — sans exiger l'abonnement Stripe. */
export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth({ skipSubscriptionCheck: true });
  if (auth.error) return auth.error;

  try {
    await checkRateLimit(devisClaimDraftKey(auth.workspaceUserId!), {
      maxAttempts: 10,
      windowMs: 60_000,
    });

    const body = guestDevisDraftSchema.parse(await request.json());
    const ctx = buildServiceContext(auth.workspaceUserId!, auth.user!.id, request);
    const devis = await claimGuestDraftAsDevis(ctx, body);
    return Response.json({ id: devis.id, numero: devis.numero });
  } catch (error) {
    return handleServiceError(error);
  }
}
