"use client";

import { Suspense, useEffect } from "react";
import { useCookieConsent } from "@/components/consent/CookieConsentContext";
import { GtmPageView } from "@/components/analytics/GtmPageView";
import { ANALYTICS, primaryAnalyticsProvider } from "@/lib/analytics";

interface ConsentAwareAnalyticsProps {
  nonce?: string;
}

/** Charge GTM / GA4 / Plausible / PostHog uniquement après consentement « Accepter ». */
export function ConsentAwareAnalytics({ nonce }: ConsentAwareAnalyticsProps) {
  const { analyticsAllowed } = useCookieConsent();

  useEffect(() => {
    if (!analyticsAllowed || process.env.NODE_ENV !== "production") return;

    if (ANALYTICS.gtmId && !document.getElementById("google-tag-manager")) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const script = document.createElement("script");
      script.id = "google-tag-manager";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${ANALYTICS.gtmId}`;
      if (nonce) script.setAttribute("nonce", nonce);
      document.head.appendChild(script);
    }

    if (ANALYTICS.gaMeasurementId && !document.getElementById("google-analytics-loader")) {
      const loader = document.createElement("script");
      loader.id = "google-analytics-loader";
      loader.async = true;
      loader.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.gaMeasurementId}`;
      if (nonce) loader.setAttribute("nonce", nonce);
      document.head.appendChild(loader);

      const config = document.createElement("script");
      config.id = "google-analytics-config";
      config.text = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${ANALYTICS.gaMeasurementId}', { anonymize_ip: true, send_page_view: true });
      `;
      if (nonce) config.setAttribute("nonce", nonce);
      document.head.appendChild(config);
    }

    if (
      primaryAnalyticsProvider() === "plausible" &&
      ANALYTICS.plausibleDomain &&
      !document.querySelector('script[data-domain]')
    ) {
      const script = document.createElement("script");
      script.defer = true;
      script.dataset.domain = ANALYTICS.plausibleDomain;
      script.src =
        "https://plausible.io/js/script.file-downloads.outbound-links.tagged-events.js";
      if (nonce) script.setAttribute("nonce", nonce);
      document.head.appendChild(script);
    }
  }, [analyticsAllowed, nonce]);

  if (!analyticsAllowed) return null;

  return (
    <>
      {ANALYTICS.gtmId ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${ANALYTICS.gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      ) : null}
      <Suspense fallback={null}>
        <GtmPageView />
      </Suspense>
    </>
  );
}
