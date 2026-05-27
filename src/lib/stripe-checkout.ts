import type Stripe from "stripe";
import { TRIAL_PERIOD_DAYS, isEligibleForTrial } from "./billing-constants";
import { env } from "./env";
import { getStripe } from "./stripe";

export type CheckoutPlan = "STARTER" | "PRO";

export function priceIdForPlan(plan: CheckoutPlan): string | null {
  if (plan === "PRO") return env.stripePricePro || null;
  if (plan === "STARTER") return env.stripePriceStarter || null;
  return null;
}

export interface CheckoutBuildInput {
  userId: string;
  email: string;
  plan: CheckoutPlan;
  stripeCustomerId?: string | null;
  withTrial?: boolean;
  appUrl?: string;
}

export function buildCheckoutSessionParams(input: CheckoutBuildInput): {
  applyTrial: boolean;
  params: Stripe.Checkout.SessionCreateParams;
} | { error: string } {
  const priceId = priceIdForPlan(input.plan);
  if (!priceId) {
    return { error: "Plan invalide" };
  }

  const appUrl = input.appUrl ?? env.appUrl;
  const applyTrial = input.withTrial === true && isEligibleForTrial(input.stripeCustomerId);

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: input.userId,
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: applyTrial
      ? `${appUrl}/dashboard/activer?checkout=cancel`
      : `${appUrl}/tarifs?checkout=cancel`,
    metadata: { userId: input.userId, plan: input.plan },
    subscription_data: {
      metadata: { userId: input.userId, plan: input.plan },
      ...(applyTrial ? { trial_period_days: TRIAL_PERIOD_DAYS } : {}),
    },
    ...(applyTrial ? { payment_method_collection: "always" } : {}),
  };

  if (input.stripeCustomerId) {
    params.customer = input.stripeCustomerId;
  } else {
    params.customer_email = input.email;
  }

  return { applyTrial, params };
}

export async function createSubscriptionCheckoutSession(opts: {
  userId: string;
  email: string;
  plan: CheckoutPlan;
  stripeCustomerId?: string | null;
  withTrial?: boolean;
}): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { error: "Paiement non configuré. Contactez le support." };
  }

  const built = buildCheckoutSessionParams(opts);
  if ("error" in built) {
    return built;
  }

  const session = await stripe.checkout.sessions.create(built.params);
  if (!session.url) {
    return { error: "Impossible de démarrer le paiement." };
  }

  return { url: session.url };
}
