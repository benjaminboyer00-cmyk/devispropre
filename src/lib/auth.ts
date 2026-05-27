import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { env } from "./env";
import { COOKIE_NAME, signJwt, verifyJwt } from "./jwt";

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

export async function createSession(user: SessionUser): Promise<string> {
  return signJwt({
    sub: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await verifyJwt(token);
    if (!payload.sub || !payload.email || !payload.name) return null;

    const user = await prisma.user.findFirst({
      where: { id: payload.sub as string, deletedAt: null },
      select: { id: true, email: true, name: true, plan: true },
    });

    return user;
  } catch {
    return null;
  }
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
