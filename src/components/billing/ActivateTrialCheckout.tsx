"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TRIAL_PERIOD_DAYS } from "@/lib/billing-constants";

export function ActivateTrialCheckout() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function startCheckout() {
      setError("");
      setLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "STARTER", trial: true }),
      });
      const json = await res.json();

      if (cancelled) return;

      if (json.url) {
        window.location.href = json.url;
        return;
      }

      setLoading(false);
      setError(json.error ?? "Impossible de démarrer l'essai gratuit.");
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "cancel") {
      startCheckout();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ui-card-padded mx-auto max-w-lg text-center">
      <h1 className="heading-section">Activez votre essai gratuit</h1>
      <p className="text-lead mt-4 font-light">
        {TRIAL_PERIOD_DAYS} jours gratuits sur le plan Starter — carte bancaire requise.
        Sans résiliation avant la fin de l&apos;essai, l&apos;abonnement passe à{" "}
        <strong>19€/mois</strong> automatiquement.
      </p>

      {loading && !error && (
        <p className="text-body mt-8 text-sm">Redirection vers le paiement sécurisé Stripe…</p>
      )}

      {error && (
        <>
          <p className="ui-alert-error mt-6">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ui-btn-primary mt-6 px-6 py-3"
          >
            Réessayer
          </button>
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
