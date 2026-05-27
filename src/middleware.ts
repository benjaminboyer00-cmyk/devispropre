import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, getJwtSecretKey } from "@/lib/jwt";
import { jwtVerify } from "jose";
import { authRateLimitKey, checkRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth") && request.method === "POST") {
    try {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      checkRateLimit(authRateLimitKey(ip), {
        maxAttempts: 10,
        windowMs: 15 * 60 * 1000,
      });
    } catch {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        { status: 429 }
      );
    }
  }

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  try {
    await jwtVerify(token, getJwtSecretKey());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth"],
};
