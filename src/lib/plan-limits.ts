import { Plan } from "@/generated/prisma/client";
import { prisma } from "./db";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

const FREE_DEVIS_PER_MONTH = 3;

export async function assertCanCreateDevis(userId: string, plan: Plan): Promise<void> {
  if (plan !== Plan.FREE) return;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = await prisma.devis.count({
    where: {
      userId,
      deletedAt: null,
      createdAt: { gte: startOfMonth },
    },
  });

  if (count >= FREE_DEVIS_PER_MONTH) {
    throw new PlanLimitError(
      `Plan gratuit limité à ${FREE_DEVIS_PER_MONTH} devis par mois. Passez au plan Starter pour continuer.`
    );
  }
}

export async function getDevisCountThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return prisma.devis.count({
    where: { userId, deletedAt: null, createdAt: { gte: startOfMonth } },
  });
}
