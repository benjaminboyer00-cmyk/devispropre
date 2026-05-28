import type { AuditAction } from "@/generated/prisma/client";
import { prisma } from "./db";

export interface AuditContext {
  userId: string;
  actorUserId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const METADATA_KEY_MAX = 64;
const METADATA_STRING_MAX = 500;
const USER_AGENT_MAX = 200;
const IP_MAX = 45;

/** Nettoie les métadonnées avant persistance (anti log forging / XSS dashboard). */
export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!metadata) return {};
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const safeKey = key.slice(0, METADATA_KEY_MAX).replace(/[^\w.-]/g, "");
    if (!safeKey || safeKey === "pdfUrl") continue;

    if (typeof value === "string") {
      out[safeKey] = value.slice(0, METADATA_STRING_MAX).replace(/[\x00-\x1f<>]/g, "");
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[safeKey] = value;
    } else if (value === null) {
      out[safeKey] = null;
    }
  }

  return out;
}

function sanitizeIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const trimmed = ip.trim().slice(0, IP_MAX);
  if (!/^[\d.:a-fA-F]+$/.test(trimmed)) return null;
  return trimmed;
}

function sanitizeUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null;
  return ua.slice(0, USER_AGENT_MAX).replace(/[\x00-\x1f<>]/g, "");
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
  const metadata = sanitizeAuditMetadata({
    ...(params.metadata ?? {}),
    ...(ctx.actorUserId && ctx.actorUserId !== ctx.userId
      ? { actorUserId: ctx.actorUserId }
      : {}),
  });

  return prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action: params.action,
      entityType: params.entityType.slice(0, 64),
      entityId: params.entityId.slice(0, 64),
      devisId: params.devisId,
      factureId: params.factureId,
      metadata: JSON.stringify(metadata),
      contentHash: params.contentHash ?? null,
      ipAddress: sanitizeIp(ctx.ipAddress),
      userAgent: sanitizeUserAgent(ctx.userAgent),
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
