import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, getJwtSecretKey } from "@/lib/jwt";
import { applySecurityHeaders, buildContentSecurityPolicy } from "@/lib/security-headers";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  function withHeaders(response: NextResponse): NextResponse {
    applySecurityHeaders(response, csp);
    return response;
  }

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return withHeaders(NextResponse.redirect(new URL("/connexion", request.url)));
    }

    try {
      await jwtVerify(token, getJwtSecretKey());
      return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
    } catch {
      return withHeaders(NextResponse.redirect(new URL("/connexion", request.url)));
    }
  }

  return withHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|opengraph-image).*)",
  ],
};
