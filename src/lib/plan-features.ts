import { Plan } from "@/generated/prisma/client";

export class PlanFeatureError extends Error {
  readonly requiredPlan: "Starter" | "Pro";

  constructor(message: string, requiredPlan: "Starter" | "Pro") {
    super(message);
    this.name = "PlanFeatureError";
    this.requiredPlan = requiredPlan;
  }
}

export function hasStarter(plan: Plan | string): boolean {
  return plan === Plan.STARTER || plan === Plan.PRO;
}

export function hasPro(plan: Plan | string): boolean {
  return plan === Plan.PRO;
}

export function assertStarterFeature(plan: Plan | string, featureLabel: string): void {
  if (!hasStarter(plan)) {
    throw new PlanFeatureError(
      `${featureLabel} — disponible à partir du plan Starter (19€/mois).`,
      "Starter"
    );
  }
}

export function assertProFeature(plan: Plan | string, featureLabel: string): void {
  if (!hasPro(plan)) {
    throw new PlanFeatureError(
      `${featureLabel} — disponible sur le plan Pro (39€/mois).`,
      "Pro"
    );
  }
}
