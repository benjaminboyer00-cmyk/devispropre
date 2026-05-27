/** Collecte Web Vitals (LCP, INP, CLS) — complété par Plausible/PostHog côté client. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (process.env.ANALYTICS_VITALS_LOG === "true") {
      console.info("[web-vitals]", body);
    }
  } catch {
    /* payload invalide — ignorer */
  }
  return new Response(null, { status: 204 });
}
