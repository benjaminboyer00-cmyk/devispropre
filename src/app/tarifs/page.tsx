import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { jsonLdTarifs, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tarifs — À partir de 19€/mois sans engagement",
  description:
    "DevisPropre : plan gratuit (3 devis/mois), Starter 19€/mois illimité, Pro 39€/mois pour équipes. Paiement Stripe, annulable en 1 clic.",
  path: "/tarifs",
});

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
    <>
      <JsonLd data={jsonLdTarifs()} />
      <div className="page-shell max-w-5xl">
        <h1 className="page-title text-center">Le pricing qui tue la prise de tête</h1>
        <p className="mt-4 text-center text-muted-foreground">
          Paiement sécurisé Stripe · Annulable en 1 clic · Premier devis accepté = rentabilisé
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`card-padded ${plan.highlight ? "ring-2 ring-primary border-primary/50" : ""}`}
            >
              {plan.highlight && (
                <span className="mb-3 inline-block rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                  Populaire
                </span>
              )}
              <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
              <p className="mt-2">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
              <ul className="mt-6 space-y-2.5 text-sm text-foreground/90">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/inscription" className="btn-primary px-8 py-4 text-base">
            Essai gratuit 30 jours — sans carte
          </Link>
        </div>
      </div>
    </>
  );
}
