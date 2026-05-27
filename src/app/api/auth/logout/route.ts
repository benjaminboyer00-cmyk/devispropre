import { NextRequest } from "next/server";
import { logoutSession } from "@/lib/auth";
import { assertMutationSecurity } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);
  await logoutSession();
  return Response.json({ ok: true });
}
