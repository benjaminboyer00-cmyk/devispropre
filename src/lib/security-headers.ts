/** En-têtes HTTP de sécurité — appliqués via next.config et middleware. */

const STATIC_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function buildContentSecurityPolicy(nonce: string): string {
  const devEval = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com${devEval}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com https://m.stripe.network",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export const SECURITY_HEADERS: Record<string, string> = {
  ...STATIC_HEADERS,
  // Fallback sans nonce (next.config) — remplacé par middleware pour les pages HTML
  "Content-Security-Policy": buildContentSecurityPolicy("fallback"),
};

export function applySecurityHeaders(response: Response, csp?: string): Response {
  for (const [key, value] of Object.entries(STATIC_HEADERS)) {
    if (key === "Strict-Transport-Security" && process.env.NODE_ENV !== "production") {
      continue;
    }
    response.headers.set(key, value);
  }
  if (csp) {
    response.headers.set("Content-Security-Policy", csp);
  }
  return response;
}
