import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { processReminders } from "@/lib/services/reminders";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = env.cronSecret;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await processReminders({
    userId: "system",
    ipAddress: null,
    userAgent: "cron",
  });

  return Response.json(result);
}
