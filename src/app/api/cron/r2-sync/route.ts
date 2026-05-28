import { NextRequest } from "next/server";
import { assertCronAuth } from "@/lib/cron-auth";
import { syncPendingR2Uploads } from "@/lib/object-storage";

export async function GET() {
  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const denied = assertCronAuth(request);
  if (denied) return denied;

  const result = await syncPendingR2Uploads();
  return Response.json(result);
}
