import type { NextConfig } from "next";

const STATIC_SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const CACHE_IMMUTABLE = {
  key: "Cache-Control",
  value: "public, max-age=31536000, immutable",
};

const CACHE_DAY = {
  key: "Cache-Control",
  value: "public, max-age=86400, stale-while-revalidate=604800",
};

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  poweredByHeader: false,
  async headers() {
    const security = [...STATIC_SECURITY_HEADERS];
    if (process.env.NODE_ENV === "production") {
      security.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      { source: "/(.*)", headers: security },
      { source: "/_next/static/:path*", headers: [CACHE_IMMUTABLE] },
      { source: "/icons/:path*", headers: [CACHE_IMMUTABLE] },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/manifest.webmanifest", headers: [CACHE_DAY] },
      { source: "/robots.txt", headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }] },
      { source: "/sitemap.xml", headers: [CACHE_DAY] },
      { source: "/opengraph-image", headers: [CACHE_IMMUTABLE] },
      { source: "/devis-artisan/:path*/opengraph-image", headers: [CACHE_IMMUTABLE] },
    ];
  },
};

export default nextConfig;
