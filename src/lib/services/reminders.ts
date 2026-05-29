import { Plan } from "@/generated/prisma/client";
import { prisma } from "../db";
import { logAudit, type AuditContext } from "../audit";
import { logOperationalAlert } from "../critical-alert";
import { env } from "../env";
import { resolveShareTokenRaw } from "../share-token-storage";
import { sendDevisReminderEmail, sendDevisReminderToClient } from "../email";

const REMINDER_DAYS = 3;

/** Relances J+3 automatiques — réservées aux plans Starter et Pro. */
export async function processReminders(systemCtx: AuditContext) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REMINDER_DAYS);

  const devisList = await prisma.devis.findMany({
    where: {
      status: "ENVOYE",
      deletedAt: null,
      sentAt: { lte: cutoff },
      reminderSentAt: null,
      user: { plan: { in: [Plan.STARTER, Plan.PRO] }, deletedAt: null },
    },
    include: {
      client: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          company: { select: { raisonSociale: true } },
        },
      },
    },
  });

  const results: {
    devisId: string;
    numero: string;
    clientEmailSent: boolean;
    artisanEmailSent: boolean;
    clientEmailReason?: string;
    artisanEmailReason?: string;
  }[] = [];
  const failures: string[] = [];

  for (const devis of devisList) {
    const claimed = await prisma.devis.updateMany({
      where: {
        id: devis.id,
        status: "ENVOYE",
        reminderSentAt: null,
        deletedAt: null,
      },
      data: { reminderSentAt: new Date() },
    });

    if (claimed.count === 0) continue;

    const shareRaw = resolveShareTokenRaw(devis);
    const shareUrl = shareRaw
      ? `${env.appUrl}/devis/${shareRaw}`
      : `${env.appUrl}/dashboard/devis/${devis.id}`;

    const companyName = devis.user.company?.raisonSociale ?? devis.user.name;

    let clientEmailSent = false;
    let clientEmailReason: string | undefined;

    if (devis.client.email) {
      const clientResult = await sendDevisReminderToClient({
        clientEmail: devis.client.email,
        clientNom: devis.client.nom,
        artisanName: devis.user.name,
        companyName,
        devisNumero: devis.numero,
        shareUrl,
      });
      clientEmailSent = clientResult.sent;
      clientEmailReason = clientResult.reason;
    } else {
      clientEmailReason = "Client sans email";
    }

    const artisanResult = await sendDevisReminderEmail({
      artisanEmail: devis.user.email,
      artisanName: devis.user.name,
      devisNumero: devis.numero,
      clientNom: devis.client.nom,
      clientPhone: devis.client.telephone,
      shareUrl,
    });

    await prisma.devis.update({
      where: { id: devis.id },
      data: {
        reminderSentAt:
          artisanResult.sent || clientEmailSent ? new Date() : null,
      },
    });

    if (!artisanResult.sent && artisanResult.reason) {
      failures.push(`${devis.numero}: artisan — ${artisanResult.reason}`);
    }
    if (devis.client.email && !clientEmailSent && clientEmailReason) {
      failures.push(`${devis.numero}: client — ${clientEmailReason}`);
    }

    await logAudit(
      { userId: devis.userId, ipAddress: systemCtx.ipAddress, userAgent: "cron-reminders" },
      {
        action: "REMINDER_SCHEDULED",
        entityType: "devis",
        entityId: devis.id,
        devisId: devis.id,
        metadata: {
          type: "reminder_j3_auto",
          client: devis.client.nom,
          shareUrl,
          clientEmailSent,
          clientEmailReason,
          artisanEmailSent: artisanResult.sent,
          artisanEmailReason: artisanResult.reason,
        },
      }
    );

    results.push({
      devisId: devis.id,
      numero: devis.numero,
      clientEmailSent,
      artisanEmailSent: artisanResult.sent,
      clientEmailReason,
      artisanEmailReason: artisanResult.reason,
    });
  }

  if (failures.length > 0) {
    logOperationalAlert("warning", "Relances J+3 — échecs partiels", {
      count: failures.length,
      samples: failures.slice(0, 5),
    });
  }

  return { processed: results.length, devis: results, failures: failures.length };
}
