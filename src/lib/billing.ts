import { Plan } from "@/generated/prisma/client";
import { prisma } from "./db";

export { TRIAL_PERIOD_DAYS, isEligibleForTrial } from "./billing-constants";

export const TRIAL_CHECKOUT_PLAN = Plan.STARTER;

/** Nouvel inscrit sans abonnement Stripe — doit activer l'essai avec carte. */
export async function userNeedsSubscriptionSetup(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, stripeCustomerId: true },
  });

  if (!user) return false;
  return user.plan === Plan.FREE && !user.stripeCustomerId;
}
