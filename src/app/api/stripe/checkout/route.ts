import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { assertMutationSecurity, requireAuth, apiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const { user, error } = await requireAuth();
  if (error) return error;

  const stripe = getStripe();
  if (!stripe) {
    return apiError("Paiement non configuré. Contactez le support.", 503);
  }

  const body = await request.json();
  const plan = body.plan as string;

  const priceId =
    plan === "PRO" ? env.stripePricePro : plan === "STARTER" ? env.stripePriceStarter : null;

  if (!priceId) return apiError("Plan invalide");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true, email: true },
  });

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.appUrl}/dashboard?checkout=success`,
    cancel_url: `${env.appUrl}/tarifs?checkout=cancel`,
    metadata: { userId: user.id, plan },
  };

  if (dbUser?.stripeCustomerId) {
    sessionParams.customer = dbUser.stripeCustomerId;
  } else {
    sessionParams.customer_email = dbUser?.email ?? user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return Response.json({ url: session.url });
}
