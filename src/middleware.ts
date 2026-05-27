import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, getJwtSecretKey } from "@/lib/jwt";
import { authRateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { applySecurityHeaders } from "@/lib/security-headers";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth") && request.method === "POST") {
    try {
      const ip = request.headers.get("x-real-ip") ?? "unknown";
      checkRateLimit(authRateLimitKey(ip), {
        maxAttempts: 10,
        windowMs: 15 * 60 * 1000,
      });
    } catch {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Trop de tentatives. Réessayez dans 15 minutes." },
          { status: 429 }
        )
      );
    }
  }

  if (pathname.startsWith("/api/public/devis") && request.method === "POST") {
    try {
      const ip = request.headers.get("x-real-ip") ?? "unknown";
      checkRateLimit(`public-devis:${ip}`, { maxAttempts: 20, windowMs: 60 * 60 * 1000 });
    } catch {
      return applySecurityHeaders(
        NextResponse.json({ error: "Trop de tentatives." }, { status: 429 })
      );
    }
  }

  if (!pathname.startsWith("/dashboard")) {
    return applySecurityHeaders(NextResponse.next());
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/connexion", request.url))
    );
  }

  try {
    await jwtVerify(token, getJwtSecretKey());
    return applySecurityHeaders(NextResponse.next());
  } catch {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/connexion", request.url))
    );
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth", "/api/public/devis/:path*"],
};
