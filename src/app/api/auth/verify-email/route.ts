import { NextRequest, NextResponse } from "next/server";
import { acceptTeamInvites } from "@/lib/account-context";
import { applySessionCookie, createSession, sessionMetaFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { consumeEmailVerification } from "@/lib/email-verification";
import { env } from "@/lib/env";
import { ROUTES } from "@/lib/routes";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const loginUrl = new URL(ROUTES.connexion, env.appUrl);

  if (!token?.trim()) {
    loginUrl.searchParams.set("error", "lien_invalide");
    return NextResponse.redirect(loginUrl);
  }

  const userId = await consumeEmailVerification(token);
  if (!userId) {
    loginUrl.searchParams.set("error", "lien_expire");
    return NextResponse.redirect(loginUrl);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, email: true, name: true, plan: true },
  });

  if (!user) {
    loginUrl.searchParams.set("error", "lien_invalide");
    return NextResponse.redirect(loginUrl);
  }

  await acceptTeamInvites(user.email, user.id);
  const sessionToken = await createSession(user, sessionMetaFromRequest(request));
  const response = NextResponse.redirect(new URL(ROUTES.dashboard, env.appUrl));
  return applySessionCookie(response, sessionToken);
}
