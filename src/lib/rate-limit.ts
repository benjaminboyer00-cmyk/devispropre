type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export class RateLimitError extends Error {
  constructor(message = "Trop de tentatives. Réessayez dans quelques minutes.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Rate limiter en mémoire — suffisant pour un VPS mono-instance. */
export function checkRateLimit(
  key: string,
  { maxAttempts, windowMs }: { maxAttempts: number; windowMs: number }
): void {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (entry.count >= maxAttempts) {
    throw new RateLimitError();
  }

  entry.count += 1;
}

export function getClientIp(request: Request): string {
  // Ne pas faire confiance à x-forwarded-for pour du blocking — clé de rate limit locale
  return "local";
}

export function authRateLimitKey(ip: string, email?: string): string {
  return `auth:${ip}:${email?.toLowerCase() ?? "unknown"}`;
}
