import type { AuditAction } from "@/generated/prisma/client";
import { canonicalize, sha256 } from "./crypto";
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

/** Version du format d'empreinte des entrées d'audit — à incrémenter si les champs changent. */
export const AUDIT_CHAIN_VERSION = 1;

/** Champs couverts par l'empreinte (devisId/factureId exclus : FK susceptibles d'être remises à null). */
export interface AuditChainEntry {
  seq: number;
  prevHash: string | null;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string;
  contentHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Empreinte d'une entrée : inclut le hash de l'entrée précédente, donc modifier,
 * supprimer ou réordonner une entrée casse toutes les suivantes.
 */
export function computeAuditEntryHash(entry: AuditChainEntry): string {
  return sha256(
    canonicalize({
      v: AUDIT_CHAIN_VERSION,
      seq: entry.seq,
      prevHash: entry.prevHash,
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      contentHash: entry.contentHash,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      createdAt: entry.createdAt.toISOString(),
    })
  );
}

export type AuditChainCheck =
  | { valid: true; checked: number }
  | { valid: false; checked: number; brokenAtSeq: number; reason: "hash" | "link" | "gap" };

/** Vérifie une suite d'entrées chaînées (triées par seq croissant, à partir de seq 1). */
export function verifyAuditChain(
  entries: Array<AuditChainEntry & { entryHash: string | null }>
): AuditChainCheck {
  let prev: string | null = null;
  let expectedSeq = 1;
  for (const entry of entries) {
    if (entry.seq !== expectedSeq) {
      return { valid: false, checked: expectedSeq - 1, brokenAtSeq: expectedSeq, reason: "gap" };
    }
    if (entry.prevHash !== prev) {
      return { valid: false, checked: expectedSeq - 1, brokenAtSeq: entry.seq, reason: "link" };
    }
    if (computeAuditEntryHash(entry) !== entry.entryHash) {
      return { valid: false, checked: expectedSeq - 1, brokenAtSeq: entry.seq, reason: "hash" };
    }
    prev = entry.entryHash;
    expectedSeq += 1;
  }
  return { valid: true, checked: entries.length };
}

/** Recharge et vérifie toute la chaîne d'audit d'un espace de travail. */
export async function verifyWorkspaceAuditChain(userId: string): Promise<AuditChainCheck> {
  const entries = await prisma.auditLog.findMany({
    where: { userId, seq: { not: null } },
    orderBy: { seq: "asc" },
  });
  return verifyAuditChain(
    entries.map((e) => ({ ...e, seq: e.seq as number }))
  );
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
  const metadata = JSON.stringify(
    sanitizeAuditMetadata({
      ...(params.metadata ?? {}),
      ...(ctx.actorUserId && ctx.actorUserId !== ctx.userId
        ? { actorUserId: ctx.actorUserId }
        : {}),
    })
  );

  const fields = {
    userId: ctx.userId,
    action: params.action,
    entityType: params.entityType.slice(0, 64),
    entityId: params.entityId.slice(0, 64),
    metadata,
    contentHash: params.contentHash ?? null,
    ipAddress: sanitizeIp(ctx.ipAddress),
    userAgent: sanitizeUserAgent(ctx.userAgent),
  };

  return prisma.$transaction(async (tx) => {
    // Sérialise les ajouts d'un même espace : sans verrou, deux écritures concurrentes
    // liraient le même maillon précédent et la chaîne bifurquerait.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`audit:${ctx.userId}`}))`;

    const last = await tx.auditLog.findFirst({
      where: { userId: ctx.userId, seq: { not: null } },
      orderBy: { seq: "desc" },
      select: { seq: true, entryHash: true },
    });

    const seq = (last?.seq ?? 0) + 1;
    const prevHash = last?.entryHash ?? null;
    const createdAt = new Date();
    const entryHash = computeAuditEntryHash({ ...fields, seq, prevHash, createdAt });

    return tx.auditLog.create({
      data: {
        ...fields,
        devisId: params.devisId,
        factureId: params.factureId,
        seq,
        prevHash,
        entryHash,
        createdAt,
      },
    });
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
