import type { AuditAction } from "@/generated/prisma/client";
import { prisma } from "./db";

export interface AuditContext {
  userId: string;
  actorUserId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit(
  ctx: AuditContext,
  params: {
    action: AuditAction;
    entityType: string;
    entityId: string;
    devisId?: string;
    factureId?: string;
    metadata?: Record<string, unknown>;
    contentHash?: string | null;
  }
) {
  return prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      devisId: params.devisId,
      factureId: params.factureId,
      metadata: JSON.stringify({
        ...(params.metadata ?? {}),
        ...(ctx.actorUserId && ctx.actorUserId !== ctx.userId
          ? { actorUserId: ctx.actorUserId }
          : {}),
      }),
      contentHash: params.contentHash ?? null,
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
}

export function sanitizeAuditEntry(entry: {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  metadata: string | null;
  contentHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  let metadata: Record<string, unknown> = {};
  if (entry.metadata) {
    try {
      metadata = JSON.parse(entry.metadata) as Record<string, unknown>;
      delete metadata.pdfUrl;
    } catch {
      metadata = {};
    }
  }

  return {
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    createdAt: entry.createdAt.toISOString(),
    metadata,
    contentHash: entry.contentHash,
    ipAddress: entry.ipAddress ? `${entry.ipAddress.split(".").slice(0, 2).join(".")}.x.x` : null,
    userAgent: entry.userAgent ? entry.userAgent.slice(0, 80) : null,
  };
}

export async function getEntityAuditTrail(
  userId: string,
  entityType: string,
  entityId: string
) {
  const logs = await prisma.auditLog.findMany({
    where: { userId, entityType, entityId },
    orderBy: { createdAt: "asc" },
  });

  return logs.map(sanitizeAuditEntry);
}
