import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const JWT_SECRET = new TextEncoder().encode(env.jwtSecret);

export const COOKIE_NAME = env.isProd ? "__Secure-devispropre_session" : "devispropre_session";
export const SESSION_DURATION = "7d";

export function getJwtSecretKey() {
  return JWT_SECRET;
}

export async function signJwt(payload: {
  sub: string;
  email: string;
  name: string;
  plan: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(JWT_SECRET);
}

export async function verifyJwt(token: string) {
  return jwtVerify(token, JWT_SECRET);
}
