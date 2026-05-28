import { NextRequest } from "next/server";
import { assertCronAuth } from "@/lib/cron-auth";
import { purgeExpiredIdempotencyRecords } from "@/lib/services/cleanup";

export async function GET() {
  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const idempotency = await purgeExpiredIdempotencyRecords();
  return Response.json({ ok: true, idempotency });
}
