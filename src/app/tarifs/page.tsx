import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tarifs — À partir de 19€/mois sans engagement",
  description:
    "DevisPropre : plan gratuit (3 devis/mois), Starter 19€/mois illimité, Pro 39€/mois pour équipes. Paiement Stripe, annulable en 1 clic.",
  alternates: { canonical: `${SITE.url}/tarifs` },
};

const PLANS = [
  {
    name: "Gratuit",
    price: "0€",
    period: "",
    desc: "3 devis / mois — pour découvrir",
    features: ["PDF professionnel", "Mentions légales", "Conformité de base"],
  },
  {
    name: "Starter",
    price: "19€",
    period: "/mois",
    desc: "Artisan solo : illimité",
    highlight: true,
    features: [
      "Devis illimités",
      "WhatsApp & relances auto J+3",
      "Factures conformes TVA 2018",
      "Attestation individuelle",
    ],
  },
  {
    name: "Pro",
    price: "39€",
    period: "/mois",
    desc: "Petite équipe : 5 utilisateurs",
    features: ["Tout Starter", "Statistiques avancées", "Multi-utilisateurs", "Support prioritaire"],
  },
];

export default function TarifsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-center text-3xl font-bold">Le pricing qui tue la prise de tête</h1>
      <p className="mt-4 text-center text-slate-600">
        Paiement sécurisé Stripe · Annulable en 1 clic · Premier devis accepté = rentabilisé
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 ${
              plan.highlight ? "border-blue-600 ring-2 ring-blue-600" : "border-slate-200 bg-white"
            }`}
          >
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="mt-2">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-slate-500">{plan.period}</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">{plan.desc}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/inscription"
          className="inline-block rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700"
        >
          Essai gratuit 30 jours — sans carte
        </Link>
      </div>
    </div>
  );
}
