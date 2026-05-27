import { env } from "./env";

export class CsrfError extends Error {
  constructor() {
    super("Requête refusée — origine non autorisée.");
    this.name = "CsrfError";
  }
}

/** Vérifie Origin/Referer + Sec-Fetch-Site pour les mutations cookie-based. */
export function assertSameOrigin(request: Request): void {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    throw new CsrfError();
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = env.allowedOrigins.map(normalizeOrigin);

  if (origin) {
    if (!allowed.includes(normalizeOrigin(origin))) {
      throw new CsrfError();
    }
    return;
  }

  if (referer) {
    try {
      const refOrigin = normalizeOrigin(new URL(referer).origin);
      if (!allowed.includes(refOrigin)) {
        throw new CsrfError();
      }
    } catch {
      throw new CsrfError();
    }
    return;
  }

  // Pas d'Origin/Referer : n'accepter que les requêtes same-origin explicites
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return;
  }

  if (env.isProd) {
    throw new CsrfError();
  }
}

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}
