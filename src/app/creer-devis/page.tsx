import Link from "next/link";
import { DevisForm } from "@/components/devis/DevisForm";
import { WorkflowDevisFacture } from "@/components/devis/WorkflowDevisFacture";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, CREER_DEVIS_FAQ, jsonLdBreadcrumbList, jsonLdCreerDevisFaq, jsonLdCreerDevisWebPage } from "@/lib/seo";
import { ROUTES } from "@/lib/routes";

export const metadata = pageMetadata({
  title: "Créer un devis et facture artisan gratuit — sans compte",
  description:
    "Devis BTP en 2 min sans inscription. Brouillon sauvegardé automatiquement. Compte gratuit → PDF, lien WhatsApp, puis facture conforme TVA 2018 en 1 clic.",
  path: "/creer-devis",
  keywords: [
    "créer devis gratuit sans compte",
    "devis artisan en ligne",
    "facture artisan après devis",
    "logiciel devis facture BTP",
    "devis conforme TVA 2018",
    "facturation auto entrepreneur travaux",
  ],
});

export default function CreerDevisPage() {
  return (
    <>
      <JsonLd data={jsonLdCreerDevisWebPage()} id="json-ld-creer-devis-page" />
      <JsonLd data={jsonLdCreerDevisFaq()} id="json-ld-creer-devis-faq" />
      <JsonLd
        id="json-ld-creer-devis-breadcrumb"
        data={jsonLdBreadcrumbList([
          { name: "Accueil", path: ROUTES.home },
          { name: "Créer un devis", path: ROUTES.creerDevis },
        ])}
      />

      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <nav className="text-subtle text-sm" aria-label="Fil d'Ariane">
          <Link href={ROUTES.home} className="link-underline">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <span>Créer un devis</span>
        </nav>

        <h1 className="heading-hero mt-4 text-3xl">
          Créez votre devis — facture incluse dans le parcours
        </h1>
        <p className="text-lead mt-3 font-light">
          Sans compte pour commencer. Votre brouillon est{" "}
          <strong className="font-medium">sauvegardé automatiquement</strong> sur cet appareil.
          Inscrivez-vous ensuite pour le PDF, le lien client (WhatsApp, SMS, email) et la{" "}
          <strong className="font-medium">facture conforme</strong> dès acceptation.
        </p>

        <ul className="text-body mt-6 flex flex-wrap gap-2 text-xs">
          <li className="rounded-full bg-[var(--blue-soft)] px-3 py-1 text-[var(--blue)]">
            Devis + facture
          </li>
          <li className="rounded-full bg-[var(--accent-soft)] px-3 py-1">TVA 2018</li>
          <li className="rounded-full bg-[var(--surface-muted)] px-3 py-1">Sauvegarde locale</li>
          <li className="rounded-full bg-[var(--surface-muted)] px-3 py-1">WhatsApp & lien client</li>
        </ul>

        <div className="ui-card-padded mt-8">
          <DevisForm clients={[]} mode="guest" />
        </div>

        <WorkflowDevisFacture />

        <section className="mt-12 border-t border-[var(--border)] pt-10">
          <h2 className="heading-section text-xl">Questions fréquentes</h2>
          <dl className="mt-6 space-y-6">
            {CREER_DEVIS_FAQ.map((item) => (
              <div key={item.q}>
                <dt className="heading font-semibold">{item.q}</dt>
                <dd className="text-body mt-2 text-sm">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-body mt-10 text-center text-sm">
          Besoin d&apos;aide sur la facturation ?{" "}
          <Link href={ROUTES.guideFacturationAe} className="link-underline font-medium">
            Guide devis → facture
          </Link>
        </p>
      </div>
    </>
  );
}
