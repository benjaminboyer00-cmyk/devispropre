import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { CITIES, TRADES, localSeoPath } from "@/lib/local-seo";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, jsonLdFaqFromItems, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Devis et factures par métier — artisans BTP",
  description:
    "Logiciel de devis et factures pour plombiers, électriciens, peintres, maçons, couvreurs et chauffagistes. PDF conforme TVA 2018, WhatsApp, essai 15 jours.",
  path: ROUTES.devisArtisanHub,
  keywords: [
    "devis artisan",
    "devis plombier",
    "devis électricien",
    "logiciel devis BTP",
    "facture artisan",
  ],
});

const BREADCRUMBS = [
  { name: "Accueil", path: "/" },
  { name: "Devis artisan", path: ROUTES.devisArtisanHub },
];

const HUB_FAQ = [
  {
    q: "DevisPropre convient-il à mon métier ?",
    a: "Oui — plomberie, électricité, peinture, maçonnerie, couverture et chauffage. Chaque page métier détaille les cas d'usage terrain.",
  },
  {
    q: "Puis-je envoyer le devis par WhatsApp ?",
    a: "Avec le plan Starter, un lien client et un message pré-rempli sont générés à l'envoi du devis.",
  },
  {
    q: "La facturation est-elle conforme à la loi anti-fraude TVA 2018 ?",
    a: "Oui — verrouillage à l'émission, empreinte SHA-256, chaînage des factures et attestation PDF.",
  },
];

export default function DevisArtisanHubPage() {
  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(BREADCRUMBS)} />
      <JsonLd data={jsonLdFaqFromItems(HUB_FAQ)} />

      <article className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <nav aria-label="Fil d'Ariane" className="text-sm text-subtle">
          <Link href="/" className="link-blue hover:underline">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <span>Devis artisan</span>
        </nav>

        <h1 className="heading-hero mt-6 text-3xl sm:text-4xl">
          Devis et factures pour artisans du BTP
        </h1>
        <p className="text-lead mt-4 font-light">
          Choisissez votre métier pour découvrir comment DevisPropre s&apos;adapte à votre activité —
          devis PDF en 2 minutes, partage client et facturation conforme.
        </p>

        <section className="mt-12">
          <h2 className="heading-section text-xl">Par métier</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {Object.values(TRADES).map((trade) => (
              <li key={trade.slug}>
                <Link href={localSeoPath(trade.slug)} className="ui-list-row block">
                  <span className="heading font-medium">{trade.plural}</span>
                  <span className="text-body mt-1 block text-sm">{trade.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="heading-section text-xl">Exemples par ville</h2>
          <p className="text-body mt-3 text-sm">
            Pages locales pour les principales métropoles — contenu adapté au terrain.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {Object.values(CITIES).map((city) => (
              <li key={city.slug}>
                <Link
                  href={localSeoPath("plombier", city.slug)}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--surface-muted)]"
                >
                  Plombier {city.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href={ROUTES.inscription} className="ui-btn-primary px-6 py-3">
            Essayer gratuitement
          </Link>
          <Link href={ROUTES.tarifs} className="ui-btn-outline px-6 py-3">
            Voir les tarifs
          </Link>
        </div>
      </article>
    </>
  );
}
