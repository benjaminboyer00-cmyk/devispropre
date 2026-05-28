/** Turnstile côté client — NEXT_PUBLIC_TURNSTILE_SITE_KEY requis pour afficher le widget. */
export function isTurnstileRequired(): boolean {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "").length > 0;
}
