import { NextRequest } from "next/server";
import { z } from "zod";
import {
  assertMutationSecurity,
  buildServiceContext,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import {
  isGuestDraftSignatureFresh,
  verifyGuestDraftClaim,
} from "@/lib/guest-draft-claim";
import { checkRateLimit, claimGuestDraftKey } from "@/lib/rate-limit";
import { claimGuestDraftSchema } from "@/lib/schemas/forms";
import { claimGuestDraftAsDevis } from "@/lib/services/devis";

/** Rattache un brouillon invité au compte — sans exiger l'abonnement Stripe. */
export async function POST(request: NextRequest) {
  try {
    assertMutationSecurity(request);

    const auth = await requireAuth({ skipSubscriptionCheck: true });
    if (auth.error) return auth.error;

    const body = claimGuestDraftSchema.parse(await request.json());
    const { draftId, claimSignature, signedAt, ...draft } = body;

    await checkRateLimit(claimGuestDraftKey(auth.workspaceUserId!, draftId), {
      maxAttempts: 5,
      windowMs: 60_000,
    });

    if (!verifyGuestDraftClaim(draftId, draft, claimSignature)) {
      return Response.json({ error: "Brouillon invité non autorisé." }, { status: 403 });
    }

    if (!isGuestDraftSignatureFresh(signedAt)) {
      return Response.json({ error: "Signature expirée — rouvrez l'aperçu du devis." }, { status: 403 });
    }

    const ctx = buildServiceContext(auth.workspaceUserId!, auth.user!.id, request);
    const devis = await claimGuestDraftAsDevis(ctx, draft);
    return Response.json({ id: devis.id, numero: devis.numero });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Brouillon invalide." }, { status: 400 });
    }
    return handleServiceError(error);
  }
}
