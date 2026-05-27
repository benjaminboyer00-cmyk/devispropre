import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.appUrl}/dashboard?checkout=success`,
    cancel_url: `${env.appUrl}/tarifs?checkout=cancel`,
    metadata: { userId: user.id, plan },
  });

  return Response.json({ url: session.url });
}
