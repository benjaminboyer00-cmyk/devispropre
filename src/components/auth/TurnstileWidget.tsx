"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
}

const LOAD_TIMEOUT_MS = 20_000;

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
  onError?: (message: string) => void;
  className?: string;
}

/** Widget Cloudflare Turnstile — nécessite TurnstileScript sur la page. */
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onToken, onExpire, onError, className }, ref) {
    const resolvedKey = siteKey?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);

    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;

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

      let cancelled = false;

      function renderWidget() {
        if (cancelled || !containerRef.current || !window.turnstile) return false;
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
            onErrorRef.current?.(
              "Vérification anti-robot indisponible (domaine ou cache). Essayez en navigation privée ou videz le cache."
            );
          },
          theme: "auto",
        });
        return true;
      }

      if (renderWidget()) {
        return () => {
          cancelled = true;
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          }
        };
      }

      const poll = window.setInterval(() => {
        if (renderWidget()) window.clearInterval(poll);
      }, 150);

      const timeout = window.setTimeout(() => {
        window.clearInterval(poll);
        if (!widgetIdRef.current && !cancelled) {
          onErrorRef.current?.(
            "Impossible de charger la vérification anti-robot. Désactivez les bloqueurs de pub ou rechargez la page."
          );
        }
      }, LOAD_TIMEOUT_MS);

      return () => {
        cancelled = true;
        window.clearInterval(poll);
        window.clearTimeout(timeout);
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
