import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { syncPendingR2Uploads } from "@/lib/object-storage";
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

  const result = await syncPendingR2Uploads();
  return Response.json(result);
}
