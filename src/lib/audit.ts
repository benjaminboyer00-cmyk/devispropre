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

export async function getEntityAuditTrail(
  userId: string,
  entityType: string,
  entityId: string
) {
  return prisma.auditLog.findMany({
    where: { userId, entityType, entityId },
    orderBy: { createdAt: "asc" },
  });
}
