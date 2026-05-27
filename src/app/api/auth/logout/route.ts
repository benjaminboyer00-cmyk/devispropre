import { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { assertMutationSecurity } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);
  await clearSessionCookie();
  return Response.json({ ok: true });
}
