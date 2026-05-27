import { env } from "./env";

export class CsrfError extends Error {
  constructor() {
    super("Requête refusée — origine non autorisée.");
    this.name = "CsrfError";
  }
}

/** Vérifie Origin/Referer pour les mutations API. */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) {
    // Requêtes same-origin sans header Origin (formes HTML classiques)
    return;
  }

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
  }
}

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}
