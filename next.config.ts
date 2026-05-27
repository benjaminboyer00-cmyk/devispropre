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
    ];
  },
};

export default nextConfig;
