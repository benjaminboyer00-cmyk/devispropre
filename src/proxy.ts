// Next.js 16 : proxy.ts remplace middleware.ts — protection /dashboard, CSP, cache SEO.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, getJwtSecretKey, parseJwtSessionPayload } from "@/lib/jwt";
import { isLocalSeoPath, isMarketingCacheable } from "@/lib/local-seo";
import { ROUTES } from "@/lib/routes";
import { applySecurityHeaders, buildContentSecurityPolicy } from "@/lib/security-headers";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  function withHeaders(response: NextResponse): NextResponse {
    applySecurityHeaders(response, csp);

    if (isLocalSeoPath(pathname) && process.env.NODE_ENV === "production") {
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=86400, stale-while-revalidate=604800"
      );
    } else if (isMarketingCacheable(pathname) && process.env.NODE_ENV === "production") {
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=86400"
      );
    }

    if (pathname === "/sw.js") {
      response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
      response.headers.set("Service-Worker-Allowed", "/");
    }

    if (pathname.startsWith("/icons/") || pathname === "/manifest.webmanifest") {
      response.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    }

    return response;
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return withHeaders(NextResponse.redirect(new URL(ROUTES.connexion, request.url)));
    }

    try {
      const { payload } = await jwtVerify(token, getJwtSecretKey());
      const sessionPayload = parseJwtSessionPayload(payload as Record<string, unknown>);
      if (!sessionPayload) {
        return withHeaders(NextResponse.redirect(new URL(ROUTES.connexion, request.url)));
      }

      const { isSessionActive } = await import("@/lib/user-session");
      const active = await isSessionActive(
        sessionPayload.jti,
        sessionPayload.sub,
        sessionPayload.sv
      );
      if (!active) {
        return withHeaders(NextResponse.redirect(new URL(ROUTES.connexion, request.url)));
      }

      const { getAccountContext } = await import("@/lib/account-context");
      const { billingUserId, userNeedsSubscriptionSetup } = await import("@/lib/billing");
      const account = await getAccountContext(sessionPayload.sub);

      if (!pathname.startsWith("/dashboard/activer") && !pathname.startsWith("/dashboard/settings")) {
        const billTo = billingUserId(sessionPayload.sub, account.workspaceUserId, account.isTeamMember);
        const needsSub = await userNeedsSubscriptionSetup(billTo);
        const devisDetail =
          /^\/dashboard\/devis\/[^/]+$/.test(pathname) && pathname !== ROUTES.dashboardDevisNew;

        if (needsSub && !devisDetail) {
          return withHeaders(
            NextResponse.redirect(new URL("/dashboard/activer", request.url))
          );
        }
      }

      return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
    } catch {
      return withHeaders(NextResponse.redirect(new URL(ROUTES.connexion, request.url)));
    }
  }

  return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|opengraph-image).*)"],
};
