"use client";

import Link from "next/link";
import { useState } from "react";
import { IconCheck } from "@/components/icons/Icons";
import { useToast } from "@/components/ui/ToastProvider";
import { TRIAL_PERIOD_DAYS } from "@/lib/billing-constants";
import { PLAN_CATALOG } from "@/lib/plan-catalog";
import { ROUTES } from "@/lib/routes";

const PLANS = [PLAN_CATALOG.FREE, PLAN_CATALOG.STARTER, PLAN_CATALOG.PRO] as const;

type PaidPlan = "STARTER" | "PRO";

async function startCheckout(plan: PaidPlan, withTrial: boolean): Promise<{ url?: string; error?: string }> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, trial: withTrial }),
  });
  const json = (await res.json()) as { url?: string; error?: string };

  if (res.status === 401) {
    return { error: "__unauthenticated__" };
  }
  if (!res.ok) {
    return { error: json.error ?? "Paiement indisponible" };
  }
  return { url: json.url };
}

export function PricingPlanCards() {
  const [loading, setLoading] = useState<PaidPlan | "FREE" | null>(null);
  const { toast } = useToast();

  async function handlePaidPlan(plan: PaidPlan) {
    setLoading(plan);
    try {
      const withTrial = plan === "STARTER";
      const result = await startCheckout(plan, withTrial);
      if (result.error === "__unauthenticated__") {
        window.location.href = ROUTES.inscription;
        return;
      }
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      toast(result.error ?? "Paiement indisponible", "error");
    } catch {
      toast("Connexion impossible — vérifiez votre réseau.", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-14 grid gap-8 md:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={
            plan.highlight
              ? "ui-card-interactive ui-plan-highlight flex flex-col rounded-2xl p-6 ring-2 sm:p-8"
              : "ui-card-interactive flex flex-col p-6 sm:p-8"
          }
        >
          <h2 className="heading-card">{plan.name}</h2>
          <p className="mt-3">
            <span className="heading text-4xl font-bold">{plan.price}</span>
            <span className="text-subtle font-normal">{plan.period}</span>
          </p>
          <p className="text-body mt-3 text-sm">{plan.desc}</p>
          <ul className="text-body mt-8 flex-1 space-y-3 text-sm">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="text-brand">
                  <IconCheck className="mt-0.5 h-5 w-5 shrink-0" />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {plan.excluded.length > 0 && (
            <p className="text-subtle mt-6 text-xs leading-relaxed">
              Non inclus : {plan.excluded.join(" · ")}
            </p>
          )}

          <div className="mt-8">
            {plan.id === "FREE" ? (
              <Link
                href={ROUTES.inscription}
                className="ui-btn-outline block w-full py-3 text-center text-sm font-semibold"
              >
                Créer un compte gratuit
              </Link>
            ) : plan.id === "STARTER" ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => handlePaidPlan("STARTER")}
                className="ui-btn-primary w-full py-3 text-sm font-semibold"
              >
                {loading === "STARTER"
                  ? "Redirection…"
                  : `Essai ${TRIAL_PERIOD_DAYS} jours gratuit`}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => handlePaidPlan("PRO")}
                className="ui-btn-outline w-full py-3 text-sm font-semibold"
              >
                {loading === "PRO" ? "Redirection…" : "Choisir le plan Pro"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
