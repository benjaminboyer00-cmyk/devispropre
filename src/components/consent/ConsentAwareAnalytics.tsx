"use client";

import { Suspense, useEffect } from "react";
import { useCookieConsent } from "@/components/consent/CookieConsentContext";
import { GtmPageView } from "@/components/analytics/GtmPageView";
import { ANALYTICS, primaryAnalyticsProvider } from "@/lib/analytics";

interface ConsentAwareAnalyticsProps {
  nonce?: string;
}

/** GTM / Plausible / PostHog après consentement — GA4 direct est dans <head> (GoogleAnalytics). */
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

  return (
    <>
      {analyticsAllowed && ANALYTICS.gtmId ? (
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
      {ANALYTICS.gaMeasurementId || ANALYTICS.gtmId ? (
        <Suspense fallback={null}>
          <GtmPageView />
        </Suspense>
      ) : null}
    </>
  );
}
