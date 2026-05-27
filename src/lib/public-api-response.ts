/** Réponses API publiques — jamais indexées par les crawlers. */
export function publicJsonResponse(
  body: unknown,
  init?: ResponseInit
): Response {
  const headers = new Headers(init?.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("Cache-Control", "private, no-store");
  return Response.json(body, { ...init, headers });
}
