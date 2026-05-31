import Link from "next/link";
import { PricingPlanCards } from "@/components/billing/PricingPlanCards";
import { IconCheck } from "@/components/icons/Icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { COMPARISON_ROWS, TARIFS_FAQ } from "@/lib/plan-catalog";
import { ROUTES } from "@/lib/routes";
import { jsonLdFaqFromItems, jsonLdTarifs, pageMetadata, SITE_TESTIMONIALS } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tarifs — À partir de 19€/mois sans engagement",
  description:
    "Gratuit : 3 devis/mois. Starter 19€ : WhatsApp, relances J+3, factures TVA 2018. Pro 39€ : équipe 5 users, stats, audit, support prioritaire.",
  path: "/tarifs",
});

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
      <JsonLd data={jsonLdFaqFromItems(TARIFS_FAQ.map((item) => ({ q: item.q, a: item.a })))} />
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
        <h1 className="heading-section text-center">Tarifs alignés sur ce que vous utilisez vraiment</h1>
        <p className="text-lead mx-auto mt-5 max-w-2xl text-center font-light">
          Chaque fonctionnalité listée est implémentée et verrouillée par plan dans l&apos;application.
          Paiement Stripe · Annulable en 1 clic.
        </p>

        <PricingPlanCards />

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

        <section className="mt-20">
          <h2 className="heading-section text-center text-xl sm:text-2xl">Avis d&apos;artisans</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {SITE_TESTIMONIALS.map((t) => (
              <li key={t.author} className="ui-card-padded">
                <p className="text-body text-sm italic leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-subtle mt-3 text-xs font-medium">
                  {t.author}, {t.role}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-14 text-center">
          <p className="text-subtle text-sm">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="link-underline">
              Connexion
            </Link>{" "}
            · Gérer votre abonnement depuis{" "}
            <Link href={ROUTES.dashboardSettings} className="link-underline">
              Mon compte
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
