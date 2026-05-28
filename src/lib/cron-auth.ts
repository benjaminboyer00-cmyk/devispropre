import type { NextRequest } from "next/server";
import { env } from "./env";
import { timingSafeEqualStrings } from "./timing-safe";

/** Vérifie Authorization: Bearer CRON_SECRET — POST uniquement. */
export function assertCronAuth(request: NextRequest): Response | null {
  if (request.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const cronSecret = env.cronSecret;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || !authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length);
  if (!timingSafeEqualStrings(token, cronSecret)) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  return null;
}
