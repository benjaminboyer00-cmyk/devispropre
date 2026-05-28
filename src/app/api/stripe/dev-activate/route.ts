import { NextRequest } from "next/server";
import { Plan } from "@/generated/prisma/client";
import { assertMutationSecurity, requireAuth, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { isDevStripeBypassEnabled } from "@/lib/stripe";
import { ROUTES } from "@/lib/routes";

/** Dev uniquement — active le plan Starter sans Stripe (DEV_SKIP_STRIPE_CHECKOUT=true). */
export async function POST(request: NextRequest) {
  if (!isDevStripeBypassEnabled()) {
    return apiError("Non disponible", 404);
  }

  assertMutationSecurity(request);

  const { user, error } = await requireAuth({ skipSubscriptionCheck: true });
  if (error) return error;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: Plan.STARTER,
      stripeCustomerId: `dev_${user.id}`,
      subscriptionPastDue: false,
    },
  });

  return Response.json({ ok: true, redirect: ROUTES.dashboard });
}
