"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";
import { TRIAL_PERIOD_DAYS } from "@/lib/billing-constants";
import { loadPendingDevisId } from "@/lib/guest-devis-draft";
import { ROUTES } from "@/lib/routes";

export function ActivateTrialCheckout() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [devBypass, setDevBypass] = useState(false);
  const [devActivating, setDevActivating] = useState(false);
  const [pendingDevisId, setPendingDevisId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPendingDevisId(loadPendingDevisId());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startCheckout() {
      setError("");
      setLoading(true);

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "STARTER", trial: true }),
        });
        const json = await res.json().catch(() => ({} as { url?: string; error?: string; devBypass?: boolean }));

        if (cancelled) return;

        if (json.url) {
          window.location.href = json.url;
          return;
        }

        const msg = json.error ?? "Impossible de démarrer l'essai gratuit.";
        toast(msg, "error");
        setLoading(false);
        setError(msg);
        setDevBypass(Boolean(json.devBypass));
      } catch {
        if (cancelled) return;
        const msg = "Connexion impossible — vérifiez votre réseau.";
        toast(msg, "error");
        setLoading(false);
        setError(msg);
      }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "cancel") {
      startCheckout();
    } else {
      setLoading(false);
      toast("Paiement annulé — vous pouvez réessayer quand vous voulez.", "info");
    }

    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function activateDevTrial() {
    setDevActivating(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/dev-activate", { method: "POST" });
      const json = await res.json().catch(() => ({} as { error?: string; redirect?: string }));

      if (!res.ok) {
        const msg = json.error ?? "Activation impossible.";
        toast(msg, "error");
        setError(msg);
        setDevActivating(false);
        return;
      }

      toast("Essai Starter activé (mode développement).");
      const pendingId = loadPendingDevisId();
      window.location.href = pendingId
        ? `${ROUTES.dashboardDevis(pendingId)}?ready=1`
        : (json.redirect ?? ROUTES.dashboard);
    } catch {
      const msg = "Connexion impossible — vérifiez votre réseau.";
      toast(msg, "error");
      setError(msg);
      setDevActivating(false);
    }
  }

  return (
    <div className="ui-card-padded mx-auto max-w-lg text-center">
      <h1 className="heading-section">Activez votre essai gratuit</h1>
      <p className="text-lead mt-4 font-light">
        {TRIAL_PERIOD_DAYS} jours gratuits sur le plan Starter.
        Sans résiliation avant la fin de l&apos;essai, l&apos;abonnement passe à{" "}
        <strong>19€/mois</strong> automatiquement.
      </p>

      {pendingDevisId && (
        <p className="text-body mt-6 rounded-lg bg-[var(--surface-muted)] px-4 py-3 text-sm">
          Votre devis est déjà enregistré.{" "}
          <Link href={ROUTES.dashboardDevis(pendingDevisId)} className="link-underline font-medium">
            Voir le devis
          </Link>{" "}
          — le lien client sera disponible après activation.
        </p>
      )}

      {loading && !error && (
        <p className="text-body mt-8 text-sm">Redirection vers le paiement sécurisé Stripe…</p>
      )}

      {error && (
        <>
          <p className="ui-alert-error mt-6">{error}</p>
          {devBypass ? (
            <button
              type="button"
              onClick={activateDevTrial}
              disabled={devActivating}
              className="ui-btn-primary mt-6 px-6 py-3"
            >
              {devActivating ? "Activation…" : "Activer l'essai (mode dev, sans Stripe)"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ui-btn-primary mt-6 px-6 py-3"
            >
              Réessayer
            </button>
          )}
          {devBypass && (
            <p className="text-subtle mt-4 text-xs">
              Ou configurez Stripe dans <code className="text-body">.env</code> :{" "}
              <code className="text-body">STRIPE_SECRET_KEY</code>,{" "}
              <code className="text-body">STRIPE_PRICE_STARTER</code>.
            </p>
          )}
        </>
      )}

      <p className="text-subtle mt-8 text-xs">
        Vous pouvez annuler à tout moment depuis votre espace Stripe ou en nous contactant.{" "}
        <Link href="/tarifs" className="link-underline">
          Voir les tarifs
        </Link>
      </p>
    </div>
  );
}
