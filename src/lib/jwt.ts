import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const JWT_SECRET = new TextEncoder().encode(env.jwtSecret);

export const COOKIE_NAME = env.isProd ? "__Secure-devispropre_session" : "devispropre_session";
export const SESSION_DURATION = "7d";

export interface JwtSessionPayload {
  sub: string;
  email: string;
  name: string;
  plan: string;
  jti: string;
  sv: number;
}

export function getJwtSecretKey() {
  return JWT_SECRET;
}

export async function signJwt(payload: JwtSessionPayload): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    plan: payload.plan,
    jti: payload.jti,
    sv: payload.sv,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(JWT_SECRET);
}

export async function verifyJwt(token: string) {
  return jwtVerify(token, JWT_SECRET);
}

export function parseJwtSessionPayload(payload: Record<string, unknown>): JwtSessionPayload | null {
  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.plan !== "string" ||
    typeof payload.jti !== "string" ||
    typeof payload.sv !== "number"
  ) {
    return null;
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    plan: payload.plan,
    jti: payload.jti,
    sv: payload.sv,
  };
}
