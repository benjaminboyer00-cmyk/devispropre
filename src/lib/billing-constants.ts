/** Durée de l'essai gratuit Starter. */
export const TRIAL_PERIOD_DAYS = 15;

export function isEligibleForTrial(stripeCustomerId: string | null | undefined): boolean {
  return !stripeCustomerId;
}
