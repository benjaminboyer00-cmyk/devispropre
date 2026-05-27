import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { processReminders } from "@/lib/services/reminders";
import { timingSafeEqualStrings } from "@/lib/timing-safe";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = env.cronSecret;

  if (!cronSecret || !authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length);
  if (!timingSafeEqualStrings(token, cronSecret)) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await processReminders({
    userId: "system",
    ipAddress: null,
    userAgent: "cron",
  });

  return Response.json(result);
}
