import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, assertMutationSecurity, getTrustedClientIpOrUnknown, handleServiceError } from "@/lib/api-helpers";
import {
  createGuestDraftId,
  isGuestDraftSignatureFresh,
  signGuestDraftClaim,
} from "@/lib/guest-draft-claim";
import { guestDevisDraftSchema } from "@/lib/schemas/forms";
import { checkRateLimit } from "@/lib/rate-limit";

const signSchema = z.object({
  draftId: z.string().uuid().optional(),
  draft: guestDevisDraftSchema,
});

/** Signe un brouillon invité (HMAC) — empêche la réclamation sans le jeton secret. */
export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const ip = getTrustedClientIpOrUnknown(request);

  try {
    await checkRateLimit(`guest-draft-sign:${ip}`, { maxAttempts: 30, windowMs: 60 * 60 * 1000 });

    const body = signSchema.parse(await request.json());
    const draftId = body.draftId ?? createGuestDraftId();
    const claimSignature = signGuestDraftClaim(draftId, body.draft);
    const signedAt = new Date().toISOString();

    return Response.json({ draftId, claimSignature, signedAt });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError("Brouillon invalide.");
    return handleServiceError(e);
  }
}
