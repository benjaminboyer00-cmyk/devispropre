import { NextRequest, NextResponse } from "next/server";
import { acceptTeamInvites } from "@/lib/account-context";
import { applySessionCookie, createSession, sessionMetaFromRequest } from "@/lib/auth";
import { env } from "@/lib/env";
import { consumeMagicLink } from "@/lib/magic-link";
import { bumpUserSessionVersion } from "@/lib/user-session";

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
  await bumpUserSessionVersion(user.id);
  const sessionToken = await createSession(user, sessionMetaFromRequest(request));
  const response = NextResponse.redirect(new URL("/dashboard", env.appUrl));
  return applySessionCookie(response, sessionToken);
}
