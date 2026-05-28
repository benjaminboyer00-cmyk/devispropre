import { assertProFeature } from "../plan-features";
import { sanitizeAuditEntry } from "../audit";
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
    const sanitized = sanitizeAuditEntry({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt,
      metadata: log.metadata,
      contentHash: log.contentHash,
      ipAddress: log.ipAddress,
      userAgent: null,
    });
    return {
      id: sanitized.id,
      action: sanitized.action,
      actionLabel: ACTION_LABELS[sanitized.action] ?? sanitized.action,
      entityType: sanitized.entityType,
      entityId: sanitized.entityId,
      contentHash: sanitized.contentHash?.slice(0, 16) ?? null,
      ipAddress: sanitized.ipAddress,
      createdAt: sanitized.createdAt,
      actorUserId:
        typeof sanitized.metadata.actorUserId === "string"
          ? sanitized.metadata.actorUserId
          : null,
      detail: sanitized.metadata,
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
