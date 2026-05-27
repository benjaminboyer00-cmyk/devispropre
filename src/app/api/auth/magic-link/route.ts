import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, assertMutationSecurity, handleServiceError } from "@/lib/api-helpers";
import {
  authEmailOnlyKey,
  authGlobalMagicLinkKey,
  authIpRateLimitKey,
  authRateLimitKey,
  checkRateLimit,
} from "@/lib/rate-limit";
import { requestMagicLink } from "@/lib/magic-link";
import { magicLinkSchema, formatZodError } from "@/lib/schemas/forms";
import { verifyTurnstileToken } from "@/lib/turnstile";

const bodySchema = magicLinkSchema.extend({
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await checkRateLimit(authGlobalMagicLinkKey(), { maxAttempts: 40, windowMs: 60 * 60 * 1000 });
    await checkRateLimit(authIpRateLimitKey(ip), { maxAttempts: 8, windowMs: 15 * 60 * 1000 });

    const body = bodySchema.parse(await request.json());
    const email = body.email.toLowerCase().trim();

    await checkRateLimit(authEmailOnlyKey(email), { maxAttempts: 2, windowMs: 15 * 60 * 1000 });
    await checkRateLimit(authRateLimitKey(ip, email), { maxAttempts: 2, windowMs: 15 * 60 * 1000 });

    await verifyTurnstileToken(body.turnstileToken, ip);

    await requestMagicLink(email);

    return Response.json({
      ok: true,
      message:
        "Si un compte existe avec cet email, un lien de connexion vient d'être envoyé. Vérifiez votre boîte mail.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(formatZodError(e));
    return handleServiceError(e);
  }
}
