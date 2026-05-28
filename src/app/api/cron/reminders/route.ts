import { NextRequest } from "next/server";
import { assertCronAuth } from "@/lib/cron-auth";
import { processReminders } from "@/lib/services/reminders";

export async function GET() {
  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const result = await processReminders({
    userId: "system",
    ipAddress: null,
    userAgent: "cron",
  });

  return Response.json(result);
}
