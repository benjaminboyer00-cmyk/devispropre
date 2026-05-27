import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "./db";
import { env } from "./env";
import {
  COOKIE_NAME,
  parseJwtSessionPayload,
  signJwt,
  verifyJwt,
} from "./jwt";
import {
  createUserSession,
  isSessionActive,
  revokeSession,
  type SessionMeta,
} from "./user-session";

export { COOKIE_NAME };

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  plan: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(
  user: SessionUser,
  meta: SessionMeta = {}
): Promise<string> {
  const { sessionId, sessionVersion } = await createUserSession(user.id, meta);

  return signJwt({
    sub: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    jti: sessionId,
    sv: sessionVersion,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await verifyJwt(token);
    const sessionPayload = parseJwtSessionPayload(payload as Record<string, unknown>);
    if (!sessionPayload) return null;

    const active = await isSessionActive(
      sessionPayload.jti,
      sessionPayload.sub,
      sessionPayload.sv
    );
    if (!active) return null;

    const user = await prisma.user.findFirst({
      where: { id: sessionPayload.sub, deletedAt: null },
      select: { id: true, email: true, name: true, plan: true },
    });

    if (!user) return null;

    return user;
  } catch {
    return null;
  }
}

export async function getSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await verifyJwt(token);
    const sessionPayload = parseJwtSessionPayload(payload as Record<string, unknown>);
    return sessionPayload?.jti ?? null;
  } catch {
    return null;
  }
}

export async function revokeSessionFromCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  try {
    const { payload } = await verifyJwt(token);
    const sessionPayload = parseJwtSessionPayload(payload as Record<string, unknown>);
    if (sessionPayload) {
      await revokeSession(sessionPayload.jti, sessionPayload.sub);
    }
  } catch {
    // Cookie invalide — rien à révoquer côté serveur.
  }
}

export function sessionMetaFromRequest(request: NextRequest): SessionMeta {
  return {
    ipAddress:
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function logoutSession(): Promise<void> {
  await revokeSessionFromCookie();
  await clearSessionCookie();
}
