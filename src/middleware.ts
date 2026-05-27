import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, getJwtSecretKey } from "@/lib/jwt";
import { MARKETING_ROUTES, ROUTES } from "@/lib/routes";
import { applySecurityHeaders, buildContentSecurityPolicy } from "@/lib/security-headers";

const MARKETING_PATHS = new Set<string>(MARKETING_ROUTES);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  function withHeaders(response: NextResponse): NextResponse {
    applySecurityHeaders(response, csp);

    if (MARKETING_PATHS.has(pathname) && process.env.NODE_ENV === "production") {
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
      await jwtVerify(token, getJwtSecretKey());
      return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
    } catch {
      return withHeaders(NextResponse.redirect(new URL(ROUTES.connexion, request.url)));
    }
  }

  return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|opengraph-image).*)",
  ],
};
