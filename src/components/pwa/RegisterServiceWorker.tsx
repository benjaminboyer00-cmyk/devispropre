"use client";

import { useEffect, useState } from "react";

export function RegisterServiceWorker() {
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }

    function trackWaiting(worker: ServiceWorker | null) {
      if (!worker) return;
      setWaitingWorker(worker);
      setUpdateReady(true);
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (reg.waiting) trackWaiting(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              trackWaiting(installing);
            }
          });
        });

        return reg.update();
      })
      .catch(() => {
        /* PWA optionnelle — échec silencieux */
      });

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  function applyUpdate() {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    setUpdateReady(false);
  }

  if (!updateReady) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-lg sm:left-auto"
    >
      <p className="text-body text-sm">Une mise à jour DevisPropre est disponible.</p>
      <button type="button" onClick={applyUpdate} className="ui-btn-primary shrink-0 px-3 py-1.5 text-sm">
        Recharger
      </button>
    </div>
  );
}
