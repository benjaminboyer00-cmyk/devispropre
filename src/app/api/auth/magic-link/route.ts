import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, assertMutationSecurity, handleServiceError } from "@/lib/api-helpers";
import { authIpRateLimitKey, authRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { requestMagicLink } from "@/lib/magic-link";
import { magicLinkSchema, formatZodError } from "@/lib/schemas/forms";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await checkRateLimit(authIpRateLimitKey(ip), { maxAttempts: 10, windowMs: 15 * 60 * 1000 });

    const body = await request.json();
    const { email } = magicLinkSchema.parse(body);

    await checkRateLimit(authRateLimitKey(ip, email), { maxAttempts: 3, windowMs: 15 * 60 * 1000 });

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
