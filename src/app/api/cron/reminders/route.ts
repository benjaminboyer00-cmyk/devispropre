import { NextRequest } from "next/server";
import { assertCronAuth } from "@/lib/cron-auth";
import { processReminders } from "@/lib/services/reminders";

export async function GET() {
  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  try {
    const result = await processReminders({
      userId: "system",
      ipAddress: null,
      userAgent: "cron",
    });

    return Response.json(result);
  } catch (err) {
    const { logOperationalAlert } = await import("@/lib/critical-alert");
    logOperationalAlert("critical", "Échec cron relances J+3", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Échec traitement relances" }, { status: 500 });
  }
}
