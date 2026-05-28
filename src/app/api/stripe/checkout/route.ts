import { NextRequest } from "next/server";
import { Plan } from "@/generated/prisma/client";
import { assertMutationSecurity, requireAuth, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createSubscriptionCheckoutSession, type CheckoutPlan } from "@/lib/stripe-checkout";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const { user, error } = await requireAuth({ skipSubscriptionCheck: true });
  if (error) return error;

  const body = await request.json();
  const plan = body.plan as string;
  const withTrial = body.trial === true;

  if (plan !== Plan.STARTER && plan !== Plan.PRO) {
    return apiError("Plan invalide");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true, email: true },
  });

  const result = await createSubscriptionCheckoutSession({
    userId: user.id,
    email: dbUser?.email ?? user.email,
    plan: plan as CheckoutPlan,
    stripeCustomerId: dbUser?.stripeCustomerId,
    withTrial,
  });

  if ("error" in result) {
    const status =
      result.error.includes("configuré") || result.error.includes("Stripe") ? 503 : 400;
    return Response.json(
      {
        error: result.error,
        devBypass: !env.isProd && process.env.DEV_SKIP_STRIPE_CHECKOUT === "true",
      },
      { status }
    );
  }

  return Response.json({ url: result.url });
}
