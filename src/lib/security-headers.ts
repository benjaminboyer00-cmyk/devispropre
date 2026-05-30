/** En-têtes HTTP de sécurité — appliqués via next.config et proxy.ts (middleware Next.js 16). */

const STATIC_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    "object-src 'none'",
    // unsafe-eval requis par Cloudflare Turnstile — pas de strict-dynamic (conflits avec l'iframe)
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com https://plausible.io https://eu-assets.i.posthog.com`,
    // style-src-elem : feuilles <link> + balises <style> (Next.js)
    `style-src-elem 'self' 'unsafe-inline' 'nonce-${nonce}'`,
    // style-src-attr : style="" sur les éléments (legacy)
    "style-src-attr 'unsafe-inline'",
    `style-src 'self' 'unsafe-inline' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https://challenges.cloudflare.com https://eu.i.posthog.com",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com https://m.stripe.network https://challenges.cloudflare.com https://plausible.io https://eu.i.posthog.com https://eu.posthog.com",
    "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
    "child-src 'self' https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function applySecurityHeaders(response: Response, csp?: string): Response {
  for (const [key, value] of Object.entries(STATIC_HEADERS)) {
    if (key === "Strict-Transport-Security" && process.env.NODE_ENV !== "production") {
      continue;
    }
    response.headers.set(key, value);
  }

  // CSP désactivée en dev : Turbopack injecte des <style> sans nonce → styles cassés.
  if (csp && process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", csp);
  }

  return response;
}
