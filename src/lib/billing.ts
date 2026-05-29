import { Plan } from "@/generated/prisma/client";
import { prisma } from "./db";

export { TRIAL_PERIOD_DAYS, isEligibleForTrial } from "./billing-constants";

export const TRIAL_CHECKOUT_PLAN = Plan.STARTER;

/** Plan payant actif (Starter ou Pro). */
export function hasActivePaidPlan(plan: Plan | string): boolean {
  return plan === Plan.STARTER || plan === Plan.PRO;
}

/** Nouvel inscrit sans abonnement Stripe — doit activer l'essai Starter. */
export async function userNeedsSubscriptionSetup(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, stripeCustomerId: true },
  });

  if (!user) return false;
  return user.plan === Plan.FREE && !user.stripeCustomerId;
}

/** Peut démarrer un essai Stripe (jamais abonné). */
export async function canStartTrial(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, stripeCustomerId: true },
  });
  if (!user) return false;
  return user.plan === Plan.FREE && !user.stripeCustomerId;
}

/** ID utilisateur facturé (propriétaire workspace si membre d'équipe). */
export function billingUserId(userId: string, workspaceUserId: string, isTeamMember: boolean): string {
  return isTeamMember ? workspaceUserId : userId;
}
