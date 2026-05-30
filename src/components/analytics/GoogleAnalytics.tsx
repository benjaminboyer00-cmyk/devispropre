import Script from "next/script";
import { ANALYTICS } from "@/lib/analytics";

/**
 * Google Analytics 4 (gtag.js) — complète GTM si vous n'avez pas encore la balise GA4 dans le conteneur.
 * Laissez NEXT_PUBLIC_GA_MEASUREMENT_ID vide si GA4 est déjà configuré dans GTM (évite le double comptage).
 */
export function GoogleAnalytics({ nonce }: { nonce?: string }) {
  const gaId = ANALYTICS.gaMeasurementId;
  if (!gaId) return null;

  return (
    <>
      <Script
        id="google-analytics-loader"
        strategy="afterInteractive"
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics-config"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true, send_page_view: true });
          `,
        }}
      />
    </>
  );
}
