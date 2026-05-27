import Stripe from "stripe";
import { env } from "./env";

export function getStripe(): Stripe | null {
  if (!env.stripeSecretKey) return null;
  return new Stripe(env.stripeSecretKey);
}
