import { prisma } from "./db";
import { ForbiddenError } from "./errors";

/** Vérifie qu'une entité appartient à l'artisan avant lecture d'audit (anti-IDOR). */
export async function assertEntityOwnedByUser(
  userId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  switch (entityType) {
    case "devis": {
      const row = await prisma.devis.findFirst({
        where: { id: entityId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!row) throw new ForbiddenError("Accès audit refusé.");
      return;
    }
    case "facture": {
      const row = await prisma.facture.findFirst({
        where: { id: entityId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!row) throw new ForbiddenError("Accès audit refusé.");
      return;
    }
    case "client": {
      const row = await prisma.client.findFirst({
        where: { id: entityId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!row) throw new ForbiddenError("Accès audit refusé.");
      return;
    }
    case "user":
      if (entityId !== userId) throw new ForbiddenError("Accès audit refusé.");
      return;
    case "company": {
      const row = await prisma.company.findFirst({
        where: { id: entityId, userId },
        select: { id: true },
      });
      if (!row) throw new ForbiddenError("Accès audit refusé.");
      return;
    }
    default:
      throw new ForbiddenError("Type d'entité non autorisé.");
  }
}
