import { NextRequest } from "next/server";
import { Plan } from "@/generated/prisma/client";
import { assertMutationSecurity, requireAuth, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
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
    return apiError(result.error, result.error.includes("configuré") ? 503 : 400);
  }

  return Response.json({ url: result.url });
}
