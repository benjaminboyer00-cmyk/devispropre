import { assertProFeature } from "../plan-features";
import type { Plan } from "@/generated/prisma/client";
import { prisma } from "../db";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Création",
  UPDATE: "Modification",
  SOFT_DELETE: "Suppression",
  LOCK: "Verrouillage",
  SEND: "Envoi",
  REMINDER_SCHEDULED: "Relance J+3",
  ACCEPT: "Acceptation",
  REFUSE: "Refus",
  CONVERT_TO_FACTURE: "Conversion facture",
  VERIFY_HASH: "Vérification intégrité",
  ISSUE: "Émission facture",
  PAY: "Paiement",
  CANCEL: "Annulation",
};

export async function getWorkspaceAuditJournal(
  workspaceUserId: string,
  plan: Plan,
  limit = 150
) {
  assertProFeature(plan, "Journal d'audit complet");

  const logs = await prisma.auditLog.findMany({
    where: { userId: workspaceUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      contentHash: true,
      ipAddress: true,
      createdAt: true,
    },
  });

  return logs.map((log) => {
    let meta: Record<string, unknown> = {};
    try {
      meta = JSON.parse(log.metadata) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
    return {
      id: log.id,
      action: log.action,
      actionLabel: ACTION_LABELS[log.action] ?? log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      contentHash: log.contentHash?.slice(0, 16) ?? null,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
      actorUserId: typeof meta.actorUserId === "string" ? meta.actorUserId : null,
      detail: meta,
    };
  });
}

export function auditJournalToCsv(
  entries: Awaited<ReturnType<typeof getWorkspaceAuditJournal>>
): string {
  const header = "Date;Action;Entité;ID;Hash;IP";
  const rows = entries.map(
    (e) =>
      `${e.createdAt};${e.actionLabel};${e.entityType};${e.entityId};${e.contentHash ?? ""};${e.ipAddress ?? ""}`
  );
  return [header, ...rows].join("\n");
}
