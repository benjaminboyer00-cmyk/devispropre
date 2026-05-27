import Link from "next/link";
import { IconCheck } from "@/components/icons/Icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { COMPARISON_ROWS, PLAN_CATALOG, TARIFS_FAQ } from "@/lib/plan-catalog";
import { jsonLdTarifs, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tarifs — À partir de 19€/mois sans engagement",
  description:
    "Gratuit : 3 devis/mois. Starter 19€ : WhatsApp, relances J+3, factures TVA 2018. Pro 39€ : équipe 5 users, stats, audit, support prioritaire.",
  path: "/tarifs",
});

const PLANS = [PLAN_CATALOG.FREE, PLAN_CATALOG.STARTER, PLAN_CATALOG.PRO];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="text-brand" aria-label="Inclus">
        <IconCheck className="mx-auto h-5 w-5" />
      </span>
    );
  }
  if (value === false) {
    return <span className="text-subtle">—</span>;
  }
  return <span className="text-body text-sm font-medium">{value}</span>;
}

export default function TarifsPage() {
  return (
    <>
      <JsonLd data={jsonLdTarifs()} />
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
        <h1 className="heading-section text-center">Tarifs alignés sur ce que vous utilisez vraiment</h1>
        <p className="text-lead mx-auto mt-5 max-w-2xl text-center font-light">
          Chaque fonctionnalité listée est implémentée et verrouillée par plan dans l&apos;application.
          Paiement Stripe · Annulable en 1 clic.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "ui-card-interactive ui-plan-highlight rounded-2xl p-6 ring-2 sm:p-8"
                  : "ui-card-interactive p-6 sm:p-8"
              }
            >
              <h2 className="heading-card">{plan.name}</h2>
              <p className="mt-3">
                <span className="heading text-4xl font-bold">{plan.price}</span>
                <span className="text-subtle font-normal">{plan.period}</span>
              </p>
              <p className="text-body mt-3 text-sm">{plan.desc}</p>
              <ul className="text-body mt-8 space-y-3 text-sm">
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
            </div>
          ))}
        </div>

        <section className="mt-20">
          <h2 className="heading-section text-center text-xl sm:text-2xl">Comparatif détaillé</h2>
          <div className="ui-list mt-8 overflow-x-auto">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-divide-theme border-b text-left">
                  <th className="p-3 font-medium">Fonctionnalité</th>
                  <th className="p-3 text-center font-medium">Gratuit</th>
                  <th className="p-3 text-center font-medium">Starter</th>
                  <th className="p-3 text-center font-medium">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-divide-theme border-b">
                    <td className="text-body p-3">{row.label}</td>
                    <td className="p-3 text-center">
                      <CellValue value={row.free} />
                    </td>
                    <td className="p-3 text-center">
                      <CellValue value={row.starter} />
                    </td>
                    <td className="p-3 text-center">
                      <CellValue value={row.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="heading-section text-center text-xl sm:text-2xl">Questions fréquentes</h2>
          <dl className="mt-8 space-y-6">
            {TARIFS_FAQ.map((item) => (
              <div key={item.q} className="ui-card-padded">
                <dt className="heading font-semibold">{item.q}</dt>
                <dd className="text-body mt-2 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-14 text-center">
          <Link href="/inscription" className="ui-btn-primary ui-btn-lg">
            Essai gratuit 15 jours — carte requise
          </Link>
          <p className="text-subtle mt-4 text-sm">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="link-underline">
              Connexion
            </Link>{" "}
            · Upgrade Starter/Pro depuis Paramètres
          </p>
        </div>
      </div>
    </>
  );
}
