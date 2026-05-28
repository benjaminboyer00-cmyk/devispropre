import Stripe from "stripe";
import type { CheckoutPlan } from "./stripe-checkout";
import { env } from "./env";

export function getStripe(): Stripe | null {
  if (!env.stripeSecretKey) return null;
  return new Stripe(env.stripeSecretKey);
}

export function isDevStripeBypassEnabled(): boolean {
  return !env.isProd && process.env.DEV_SKIP_STRIPE_CHECKOUT === "true";
}

export function getStripeCheckoutError(plan: CheckoutPlan): string | null {
  if (!env.stripeSecretKey) {
    return env.isProd
      ? "Paiement non configuré. Contactez le support."
      : "Stripe non configuré en local : ajoutez STRIPE_SECRET_KEY dans votre fichier .env.";
  }

  const priceEnv =
    plan === "PRO" ? "STRIPE_PRICE_PRO" : "STRIPE_PRICE_STARTER";
  const priceId = plan === "PRO" ? env.stripePricePro : env.stripePriceStarter;
  if (!priceId) {
    return env.isProd
      ? "Paiement non configuré. Contactez le support."
      : `Stripe incomplet en local : ajoutez ${priceEnv} dans votre fichier .env.`;
  }

  return null;
}

export function isStripeCheckoutConfigured(plan: CheckoutPlan): boolean {
  return getStripeCheckoutError(plan) === null;
}
