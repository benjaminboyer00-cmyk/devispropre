import { prisma } from "../db";
import { logAudit, type AuditContext } from "../audit";
import { env } from "../env";
import { sendDevisReminderEmail } from "../email";

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
    include: {
      client: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const results: {
    devisId: string;
    numero: string;
    emailSent: boolean;
    emailReason?: string;
  }[] = [];

  for (const devis of devisList) {
    const shareUrl = devis.shareToken
      ? `${env.appUrl}/devis/${devis.shareToken}`
      : `${env.appUrl}/dashboard/devis/${devis.id}`;

    const emailResult = await sendDevisReminderEmail({
      artisanEmail: devis.user.email,
      artisanName: devis.user.name,
      devisNumero: devis.numero,
      clientNom: devis.client.nom,
      shareUrl,
    });

    await prisma.devis.update({
      where: { id: devis.id },
      data: { reminderSentAt: new Date() },
    });

    await logAudit(
      { userId: devis.userId, ipAddress: systemCtx.ipAddress, userAgent: "cron-reminders" },
      {
        action: "REMINDER_SCHEDULED",
        entityType: "devis",
        entityId: devis.id,
        devisId: devis.id,
        metadata: {
          type: "reminder_j3",
          client: devis.client.nom,
          shareUrl,
          emailSent: emailResult.sent,
          emailReason: emailResult.reason,
        },
      }
    );

    results.push({
      devisId: devis.id,
      numero: devis.numero,
      emailSent: emailResult.sent,
      emailReason: emailResult.reason,
    });
  }

  return { processed: results.length, devis: results };
}
