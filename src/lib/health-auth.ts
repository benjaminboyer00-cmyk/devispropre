import type { NextRequest } from "next/server";
import { env } from "./env";
import { timingSafeEqualStrings } from "./timing-safe";

/** Accès détaillé healthcheck (monitoring interne). */
export function isHealthMonitorAuthorized(request: NextRequest): boolean {
  const secret = env.cronSecret;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length);
  return timingSafeEqualStrings(token, secret);
}
