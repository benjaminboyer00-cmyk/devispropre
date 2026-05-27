import { prisma } from "../db";
import { logAudit, type AuditContext } from "../audit";

const REMINDER_DAYS = 3;

/** Relances J+3 pour devis envoyés sans réponse. */
export async function processReminders(systemCtx: AuditContext) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REMINDER_DAYS);

  const devisList = await prisma.devis.findMany({
    where: {
      status: "ENVOYE",
      deletedAt: null,
      sentAt: { lte: cutoff },
      reminderSentAt: null,
    },
    include: { client: true, user: { include: { company: true } } },
  });

  const results: { devisId: string; numero: string }[] = [];

  for (const devis of devisList) {
    await prisma.devis.update({
      where: { id: devis.id },
      data: { reminderSentAt: new Date() },
    });

    await logAudit(
      { userId: devis.userId, ipAddress: systemCtx.ipAddress, userAgent: "cron-reminders" },
      {
        action: "SEND",
        entityType: "devis",
        entityId: devis.id,
        devisId: devis.id,
        metadata: { type: "reminder_j3", client: devis.client.nom },
      }
    );

    results.push({ devisId: devis.id, numero: devis.numero });
  }

  return { processed: results.length, devis: results };
}
