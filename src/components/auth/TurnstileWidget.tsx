"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      ready: (callback: () => void) => void;
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
  retry?: "auto" | "never";
  appearance?: "always" | "execute" | "interaction-only";
}

const LOAD_TIMEOUT_MS = 25_000;
const DOMAIN_ERROR =
  "Domaine non autorisé dans Cloudflare Turnstile. Ajoutez devispropre.com (et www.devispropre.com) dans le widget, ou mettez TURNSTILE_ENFORCE=false dans .env.production le temps de corriger.";

export function isTurnstileConfigured(siteKey?: string): boolean {
  return Boolean(siteKey?.trim());
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
    const resolvedKey = siteKey?.trim() ?? "";
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const suppressErrorsRef = useRef(false);
    const errorReportedRef = useRef(false);
    const onTokenRef = useRef(onToken);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);

    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;

    function safeRemove() {
      if (!widgetIdRef.current || !window.turnstile) return;
      suppressErrorsRef.current = true;
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        /* ignore */
      }
      widgetIdRef.current = null;
      suppressErrorsRef.current = false;
    }

    useImperativeHandle(ref, () => ({
      reset() {
        errorReportedRef.current = false;
        if (widgetIdRef.current && window.turnstile) {
          suppressErrorsRef.current = true;
          window.turnstile.reset(widgetIdRef.current);
          suppressErrorsRef.current = false;
        }
        onTokenRef.current("");
        onExpireRef.current?.();
      },
    }));

    useEffect(() => {
      if (!resolvedKey || !containerRef.current) return;

      let cancelled = false;
      errorReportedRef.current = false;

      function reportError(message: string) {
        if (cancelled || suppressErrorsRef.current || errorReportedRef.current) return;
        errorReportedRef.current = true;
        onErrorRef.current?.(message);
      }

      function renderWidget() {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        safeRemove();

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: resolvedKey,
          retry: "never",
          appearance: "always",
          callback: (token) => {
            errorReportedRef.current = false;
            onTokenRef.current(token);
          },
          "expired-callback": () => {
            onExpireRef.current?.();
            onTokenRef.current("");
          },
          "error-callback": () => {
            if (suppressErrorsRef.current) return;
            onExpireRef.current?.();
            onTokenRef.current("");
            reportError(DOMAIN_ERROR);
          },
          theme: "auto",
        });
      }

      function mountWhenReady() {
        if (cancelled) return;
        if (window.turnstile?.ready) {
          window.turnstile.ready(renderWidget);
        } else if (window.turnstile) {
          renderWidget();
        }
      }

      mountWhenReady();

      const timeout = window.setTimeout(() => {
        if (!widgetIdRef.current && !cancelled) {
          reportError(
            "Impossible de charger la vérification anti-robot. Désactivez les bloqueurs de pub ou rechargez la page."
          );
        }
      }, LOAD_TIMEOUT_MS);

      return () => {
        cancelled = true;
        window.clearTimeout(timeout);
        safeRemove();
      };
    }, [resolvedKey]);

    if (!resolvedKey) return null;

    return <div ref={containerRef} className={className} aria-label="Vérification anti-robot" />;
  }
);
