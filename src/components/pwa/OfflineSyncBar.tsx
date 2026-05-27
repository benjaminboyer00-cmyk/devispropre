"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  flushOfflineQueue,
  isBrowserOnline,
  queuedDevisCount,
} from "@/lib/offline-queue";

export function OfflineSyncBar() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setOnline(isBrowserOnline());
    setPending(queuedDevisCount());

    async function sync() {
      if (!isBrowserOnline() || queuedDevisCount() === 0) return;
      setSyncing(true);
      const { synced, failed } = await flushOfflineQueue();
      setPending(queuedDevisCount());
      setSyncing(false);
      if (synced > 0) {
        setMessage(`${synced} devis synchronisé${synced > 1 ? "s" : ""}.`);
        router.refresh();
      } else if (failed > 0) {
        setMessage("Synchronisation partielle — réessayez.");
      }
    }

    function onOnline() {
      setOnline(true);
      void sync();
    }

    function onOffline() {
      setOnline(false);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void sync();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [router]);

  if (online && pending === 0 && !message) return null;

  return (
    <div
      className={`border-b px-4 py-2 text-center text-sm ${
        online ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200" : "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      }`}
    >
      {!online && "📡 Mode hors-ligne — vos brouillons seront synchronisés au retour du réseau."}
      {online && pending > 0 && (syncing ? "Synchronisation des devis en cours…" : `${pending} devis en attente de sync…`)}
      {message && online && pending === 0 && message}
    </div>
  );
}
