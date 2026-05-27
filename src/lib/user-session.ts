import { prisma } from "./db";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ACTIVE_SESSIONS = 10;
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export interface SessionMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ActiveSessionRow {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
}

/** Crée une session serveur et retourne son identifiant (jti du JWT). */
export async function createUserSession(
  userId: string,
  meta: SessionMeta = {}
): Promise<{ sessionId: string; sessionVersion: number }> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { sessionVersion: true },
    });
    if (!user) throw new Error("Utilisateur introuvable.");

    await tx.userSession.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    const activeSessions = await tx.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    const overflow = activeSessions.length - MAX_ACTIVE_SESSIONS + 1;
    if (overflow > 0) {
      const toRevoke = activeSessions.slice(0, overflow).map((s) => s.id);
      await tx.userSession.updateMany({
        where: { id: { in: toRevoke } },
        data: { revokedAt: now },
      });
    }

    const session = await tx.userSession.create({
      data: {
        userId,
        expiresAt,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
      select: { id: true },
    });

    return { sessionId: session.id, sessionVersion: user.sessionVersion };
  });
}

/** Vérifie qu'une session JWT est toujours valide côté serveur. */
export async function isSessionActive(
  sessionId: string,
  userId: string,
  sessionVersion: number
): Promise<boolean> {
  const now = new Date();
  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
      expiresAt: { gt: now },
      user: { deletedAt: null, sessionVersion },
    },
    select: { id: true, lastSeenAt: true },
  });

  if (!session) return false;

  if (now.getTime() - session.lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastSeenAt: now },
    });
  }

  return true;
}

export async function revokeSession(sessionId: string, userId?: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: {
      id: sessionId,
      ...(userId ? { userId } : {}),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

/** Invalide toutes les sessions d'un utilisateur (vol de compte, changement mot de passe). */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

/** Incrémente la version de session — invalide tous les JWT émis avant. */
export async function bumpUserSessionVersion(userId: string): Promise<number> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  await revokeAllUserSessions(userId);
  return user.sessionVersion;
}

export async function listActiveSessions(userId: string): Promise<ActiveSessionRow[]> {
  const now = new Date();
  return prisma.userSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
    },
  });
}
