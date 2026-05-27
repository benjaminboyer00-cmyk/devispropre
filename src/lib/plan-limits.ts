import type { Prisma } from "@/generated/prisma/client";
import { Plan } from "@/generated/prisma/client";
import { prisma } from "./db";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export const FREE_DEVIS_PER_MONTH = 3;

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Vérification rapide hors transaction (UX) — ne suffit pas seule contre une race condition. */
export async function assertCanCreateDevis(userId: string, plan: Plan): Promise<void> {
  if (plan !== Plan.FREE) return;

  const count = await prisma.devis.count({
    where: {
      userId,
      deletedAt: null,
      createdAt: { gte: startOfCurrentMonth() },
    },
  });

  if (count >= FREE_DEVIS_PER_MONTH) {
    throw new PlanLimitError(
      `Plan gratuit limité à ${FREE_DEVIS_PER_MONTH} devis par mois. Passez au plan Starter pour continuer.`
    );
  }
}

/**
 * Verrou advisory PostgreSQL + comptage dans la même transaction que le INSERT.
 * Empêche le bypass TOCTOU (Turbo Intruder / requêtes parallèles).
 */
export async function enforceFreeDevisQuotaInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  plan: Plan
): Promise<void> {
  if (plan !== Plan.FREE) return;

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${userId}:free-devis`}))`;

  const count = await tx.devis.count({
    where: {
      userId,
      deletedAt: null,
      createdAt: { gte: startOfCurrentMonth() },
    },
  });

  if (count >= FREE_DEVIS_PER_MONTH) {
    throw new PlanLimitError(
      `Plan gratuit limité à ${FREE_DEVIS_PER_MONTH} devis par mois. Passez au plan Starter pour continuer.`
    );
  }
}

export async function getDevisCountThisMonth(userId: string): Promise<number> {
  return prisma.devis.count({
    where: { userId, deletedAt: null, createdAt: { gte: startOfCurrentMonth() } },
  });
}
