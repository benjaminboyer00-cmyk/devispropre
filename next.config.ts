import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/lib/security-headers";

const securityHeaders = Object.entries(SECURITY_HEADERS)
  .filter(([key]) => key !== "Strict-Transport-Security" || process.env.NODE_ENV === "production")
  .map(([key, value]) => ({ key, value }));

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
