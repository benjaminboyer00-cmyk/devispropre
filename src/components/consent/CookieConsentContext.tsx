"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_OPEN_EVENT,
  getStoredConsent,
  setStoredConsent,
  type CookieConsentValue,
} from "@/lib/cookie-consent";
import { googleAnalyticsEnabled, primaryAnalyticsProvider } from "@/lib/analytics";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";

interface CookieConsentContextValue {
  consent: CookieConsentValue | null;
  analyticsAllowed: boolean;
  setConsent: (value: CookieConsentValue) => void;
  openPreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function analyticsNeedsConsent(): boolean {
  return googleAnalyticsEnabled() || primaryAnalyticsProvider() !== null;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<CookieConsentValue | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredConsent();
    setConsentState(stored);
    setShowBanner(stored === null && analyticsNeedsConsent());
  }, []);

  useEffect(() => {
    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentValue>).detail;
      if (detail === "all" || detail === "essential") {
        setConsentState(detail);
        setShowBanner(false);
      }
    };
    const onOpen = () => setShowBanner(true);

    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
    };
  }, []);

  const setConsent = useCallback((value: CookieConsentValue) => {
    setStoredConsent(value);
    setConsentState(value);
    setShowBanner(false);
  }, []);

  const openPreferences = useCallback(() => {
    setShowBanner(true);
  }, []);

  const value = useMemo(
    () => ({
      consent: mounted ? consent : null,
      analyticsAllowed: consent === "all",
      setConsent,
      openPreferences,
    }),
    [consent, mounted, setConsent, openPreferences]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {mounted && showBanner && analyticsNeedsConsent() ? (
        <CookieConsentBanner
          onAccept={() => setConsent("all")}
          onReject={() => setConsent("essential")}
        />
      ) : null}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
