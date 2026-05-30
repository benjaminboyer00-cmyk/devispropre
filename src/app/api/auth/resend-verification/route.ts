import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getTrustedClientIpOrUnknown,
  handleServiceError,
} from "@/lib/api-helpers";
import { requestEmailVerification } from "@/lib/email-verification";
import { authIpRateLimitKey, authResendVerificationKey, checkRateLimit } from "@/lib/rate-limit";
import { formatZodError, magicLinkSchema } from "@/lib/schemas/forms";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const ip = getTrustedClientIpOrUnknown(request);

  try {
    const body = magicLinkSchema.parse(await request.json());
    const email = body.email.toLowerCase().trim();

    await checkRateLimit(authIpRateLimitKey(ip), { maxAttempts: 10, windowMs: 15 * 60 * 1000 });
    await checkRateLimit(authResendVerificationKey(ip, email), {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000,
    });

    await requestEmailVerification(email);

    return Response.json({
      ok: true,
      message: "Si un compte non confirmé existe, un email vient d'être renvoyé.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(formatZodError(e));
    return handleServiceError(e);
  }
}
