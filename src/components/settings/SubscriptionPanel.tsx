"use client";

import { useState } from "react";
import Link from "next/link";
import { PLAN_CATALOG } from "@/lib/plan-catalog";
import { TRIAL_PERIOD_DAYS } from "@/lib/billing-constants";
import { ROUTES } from "@/lib/routes";

interface SubscriptionPanelProps {
  plan: string;
  hasStripeCustomer: boolean;
  isTeamMember: boolean;
}

export function SubscriptionPanel({ plan, hasStripeCustomer, isTeamMember }: SubscriptionPanelProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");

  const catalog = PLAN_CATALOG[plan as keyof typeof PLAN_CATALOG] ?? PLAN_CATALOG.FREE;

  async function checkout(checkoutPlan: "STARTER" | "PRO") {
    setLoading(checkoutPlan);
    setMessage("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: checkoutPlan }),
    });
    const json = await res.json();
    setLoading("");
    if (json.url) {
      window.location.href = json.url;
    } else {
      setMessage(json.error ?? "Paiement indisponible");
    }
  }

  async function openPortal() {
    setLoading("portal");
    setMessage("");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const json = await res.json();
    setLoading("");
    if (json.url) {
      window.location.href = json.url;
    } else {
      setMessage(json.error ?? "Portail indisponible");
    }
  }

  if (isTeamMember) {
    return (
      <div className="ui-card-padded">
        <h2 className="heading font-semibold">Abonnement</h2>
        <p className="text-body mt-2 text-sm">
          Vous êtes membre d&apos;une équipe Pro. La facturation est gérée par le propriétaire du compte.
        </p>
        <p className="text-body mt-2 text-sm">
          Plan actuel : <strong>{catalog.name}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="ui-card-padded space-y-4" id="abonnement">
      <h2 className="heading font-semibold">Abonnement</h2>
      <p className="text-body text-sm">
        Plan actuel : <strong>{catalog.name}</strong> — {catalog.desc}
      </p>

      <ul className="text-body space-y-1 text-sm">
        {catalog.features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
        {catalog.excluded.map((f) => (
          <li key={f} className="text-subtle">
            ✗ {f}
          </li>
        ))}
      </ul>

      {plan === "FREE" && !hasStripeCustomer && (
        <p className="ui-alert-error text-sm">
          Essai Starter non activé —{" "}
          <Link href={ROUTES.dashboardActiver} className="link-underline font-medium">
            enregistrer votre carte ({TRIAL_PERIOD_DAYS} jours gratuits)
          </Link>
        </p>
      )}

      {message && (
        <p className={message.includes("Erreur") || message.includes("indisponible") || message.includes("configuré") ? "ui-alert-error" : "ui-alert-success"}>
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {hasStripeCustomer && (
          <button
            type="button"
            disabled={!!loading}
            onClick={openPortal}
            className="ui-btn-primary text-sm"
          >
            {loading === "portal" ? "Redirection…" : "Gérer l'abonnement (Stripe)"}
          </button>
        )}
        {plan !== "STARTER" && plan !== "PRO" && (
          <button
            type="button"
            disabled={!!loading}
            onClick={() => checkout("STARTER")}
            className="ui-btn-primary text-sm"
          >
            {loading === "STARTER" ? "Redirection…" : "Starter — 19€/mois"}
          </button>
        )}
        {plan !== "PRO" && (
          <button
            type="button"
            disabled={!!loading}
            onClick={() => checkout("PRO")}
            className="ui-btn-outline text-sm"
          >
            {loading === "PRO" ? "Redirection…" : "Pro — 39€/mois"}
          </button>
        )}
      </div>

      <p className="text-subtle text-xs">
        Résiliation, factures et moyen de paiement via le portail Stripe sécurisé.{" "}
        <Link href={ROUTES.tarifs} className="link-underline">
          Comparer les plans
        </Link>
      </p>
    </div>
  );
}
