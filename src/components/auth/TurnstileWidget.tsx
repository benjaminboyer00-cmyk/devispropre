"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
}

export function isTurnstileConfigured(siteKey?: string): boolean {
  return (siteKey?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "").length > 0;
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey?: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}

/** Widget Cloudflare Turnstile — siteKey injecté côté serveur (runtime Docker). */
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onToken, onExpire, className }, ref) {
    const resolvedKey = siteKey?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    const onExpireRef = useRef(onExpire);

    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;

    useImperativeHandle(ref, () => ({
      reset() {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        onTokenRef.current("");
        onExpireRef.current?.();
      },
    }));

    useEffect(() => {
      if (!resolvedKey || !containerRef.current) return;

      function renderWidget() {
        if (!containerRef.current || !window.turnstile) return;
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: resolvedKey,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => {
            onExpireRef.current?.();
            onTokenRef.current("");
          },
          "error-callback": () => {
            onExpireRef.current?.();
            onTokenRef.current("");
          },
          theme: "auto",
        });
      }

      if (window.turnstile) {
        renderWidget();
      } else {
        window.onTurnstileLoad = renderWidget;
        if (!document.querySelector('script[src*="turnstile/v0/api.js"]')) {
          const script = document.createElement("script");
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
          script.async = true;
          script.defer = true;
          const nonce = document.querySelector("script[nonce]")?.getAttribute("nonce");
          if (nonce) script.setAttribute("nonce", nonce);
          document.head.appendChild(script);
        }
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [resolvedKey]);

    if (!resolvedKey) return null;

    return <div ref={containerRef} className={className} aria-label="Vérification anti-robot" />;
  }
);
