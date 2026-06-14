import Script from "next/script";
import { ANALYTICS } from "@/lib/analytics";

/**
 * Google tag (gtag.js) — dans <head> sur toutes les pages (détectable par Google Analytics).
 * Consent Mode v2 : pas de cookies analytics tant que l'utilisateur n'a pas accepté.
 */
export function GoogleAnalytics({ nonce }: { nonce?: string }) {
  const gaId = ANALYTICS.gaMeasurementId;
  if (!gaId) return null;

  const initScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500
    });
    gtag('js', new Date());
    gtag('config', '${gaId}', { anonymize_ip: true });
  `;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- root layout <head> (App Router), chargement avant hydratation requis pour Consent Mode */}
      <Script
        id="google-analytics-loader"
        strategy="beforeInteractive"
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- root layout <head> (App Router), chargement avant hydratation requis pour Consent Mode */}
      <Script
        id="google-analytics-config"
        strategy="beforeInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: initScript }}
      />
    </>
  );
}
