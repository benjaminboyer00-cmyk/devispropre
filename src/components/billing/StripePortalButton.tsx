"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

/** Ouvre le portail Stripe Billing en un clic (carte, factures). */
export function StripePortalButton({ className = "ui-btn-primary mt-3 inline-flex px-6 py-2.5 text-sm font-semibold" }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function openPortal() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        const msg = data.error ?? "Impossible d'ouvrir le portail de paiement.";
        toast(msg, "error");
        setError(msg);
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      const msg = "Connexion impossible — vérifiez votre réseau.";
      toast(msg, "error");
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        aria-busy={loading}
        className={className}
      >
        {loading ? "Ouverture du portail sécurisé…" : "Mettre à jour ma carte →"}
      </button>
      {error && <p className="ui-alert-error mt-2 text-xs">{error}</p>}
    </div>
  );
}
