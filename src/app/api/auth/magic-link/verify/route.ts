import { NextRequest, NextResponse } from "next/server";
import { acceptTeamInvites } from "@/lib/account-context";
import { createSession, sessionMetaFromRequest, setSessionCookie } from "@/lib/auth";
import { env } from "@/lib/env";
import { consumeMagicLink } from "@/lib/magic-link";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const loginUrl = new URL("/connexion", env.appUrl);

  if (!token?.trim()) {
    loginUrl.searchParams.set("error", "lien_invalide");
    return NextResponse.redirect(loginUrl);
  }

  const user = await consumeMagicLink(token);
  if (!user) {
    loginUrl.searchParams.set("error", "lien_expire");
    return NextResponse.redirect(loginUrl);
  }

  await acceptTeamInvites(user.email, user.id);
  const sessionToken = await createSession(user, sessionMetaFromRequest(request));
  await setSessionCookie(sessionToken);

  return NextResponse.redirect(new URL("/dashboard", env.appUrl));
}
