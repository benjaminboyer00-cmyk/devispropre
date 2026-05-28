"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import {
  flushOfflineQueue,
  isBrowserOnline,
  queuedDevisCount,
} from "@/lib/offline-queue";

export function OfflineSyncBar() {
  const router = useRouter();
  const { toast } = useToast();
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
        const msg =
          synced === 1
            ? "Votre devis en attente a été synchronisé avec succès !"
            : `Vos ${synced} devis en attente ont été synchronisés avec succès !`;
        toast(msg);
        setMessage(msg);
        router.refresh();
      } else if (failed > 0) {
        const msg = "Synchronisation partielle — réessayez.";
        toast(msg, "error");
        setMessage(msg);
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
  }, [router, toast]);

  if (online && pending === 0 && !message) return null;

  const criticalPending = pending > 0;

  return (
    <div
      className={`border-b px-4 py-2 text-center text-sm ${
        !online
          ? "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          : criticalPending
            ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100"
            : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      }`}
      role="status"
    >
      {!online && "📡 Mode hors-ligne — vos brouillons seront synchronisés au retour du réseau."}
      {online && criticalPending && (
        <>
          <strong>⚠️ {pending} document{pending > 1 ? "s" : ""} en attente de réseau.</strong>{" "}
          Ne fermez pas l&apos;onglet et ne videz pas l&apos;historique du navigateur avant sync.
          {syncing ? " Synchronisation en cours…" : ""}
        </>
      )}
      {message && online && pending === 0 && message}
    </div>
  );
}
