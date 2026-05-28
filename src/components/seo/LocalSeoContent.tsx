import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import type { CityMeta, TradeMeta } from "@/lib/local-seo";
import {
  CITIES,
  LOCAL_SEO_LAST_MODIFIED,
  TRADES,
  getLocalBreadcrumbs,
  getLocalSeeAlsoLinks,
  getLocalTestimonial,
  getLocalUniqueInsight,
  localPageDescription,
  localPageTitle,
  localSeoPath,
} from "@/lib/local-seo";
import { getLocalPageSections, getTradeOnlySections } from "@/lib/local-seo-body";
import { ROUTES } from "@/lib/routes";
import {
  jsonLdBreadcrumbList,
  jsonLdFaqFromItems,
  jsonLdLocalSeoWebPage,
} from "@/lib/seo";

interface LocalSeoContentProps {
  trade: TradeMeta;
  city?: CityMeta;
}

export function LocalSeoContent({ trade, city }: LocalSeoContentProps) {
  const heading = city
    ? `Devis et factures ${trade.label.toLowerCase()} à ${city.label}`
    : `Logiciel de devis pour ${trade.plural.toLowerCase()}`;

  const breadcrumbs = getLocalBreadcrumbs(trade, city);
  const testimonial = city ? getLocalTestimonial(trade, city) : null;
  const seeAlso = getLocalSeeAlsoLinks(trade, city);
  const sections = city ? getLocalPageSections(trade, city) : getTradeOnlySections(trade);
  const pagePath = localSeoPath(trade.slug, city?.slug);
  const pageTitle = localPageTitle(trade, city);
  const pageDescription = localPageDescription(trade, city);
  const lastModified = LOCAL_SEO_LAST_MODIFIED.toISOString();

  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(breadcrumbs)} />
      <JsonLd
        data={jsonLdLocalSeoWebPage({
          name: pageTitle,
          description: pageDescription,
          path: pagePath,
          dateModified: lastModified,
        })}
      />
      {city && <JsonLd data={jsonLdFaqFromItems(sections.faq)} />}

      <article className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <nav aria-label="Fil d'Ariane" className="text-sm text-subtle">
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((item, index) => (
              <li key={item.path} className="flex items-center gap-1">
                {index > 0 && <span aria-hidden="true">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">{item.name}</span>
                ) : (
                  <Link href={item.path} className="link-blue hover:underline">
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <p className="link-blue mt-6 text-sm font-medium">
          DevisPropre · {city ? city.region : "France"}
        </p>
        <h1 className="heading-hero mt-4 text-3xl sm:text-4xl">{heading}</h1>
        <p className="text-lead mt-4 font-light">
          {city
            ? `Artisans ${trade.plural.toLowerCase()} à ${city.label} : créez un devis PDF conforme en 2 minutes depuis votre téléphone.`
            : trade.description}
        </p>

        {city && (
          <p className="text-body mt-6 leading-relaxed">{getLocalUniqueInsight(trade, city)}</p>
        )}

        {testimonial && (
          <blockquote className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-4">
            <p className="text-body text-sm italic">&ldquo;{testimonial.quote}&rdquo;</p>
            <footer className="mt-2 text-sm text-subtle">— {testimonial.author}</footer>
          </blockquote>
        )}

        <section className="mt-12">
          <h2 className="heading-section text-xl">{sections.whyTitle}</h2>
          {sections.whyParagraphs.map((p) => (
            <p key={p.slice(0, 40)} className="text-body mt-4 leading-relaxed">
              {p}
            </p>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="heading-section text-xl">{sections.featuresTitle}</h2>
          <ul className="mt-4 space-y-2 text-body">
            <li>✓ Devis PDF avec SIRET et mentions légales</li>
            <li>✓ Partage WhatsApp (plan Starter)</li>
            <li>✓ Facturation conforme loi anti-fraude TVA 2018</li>
            <li>✓ Connexion par lien email — sans mot de passe</li>
            <li>✓ Relance automatique J+3 au client (Starter+)</li>
          </ul>
          {sections.featuresParagraphs.map((p) => (
            <p key={p.slice(0, 40)} className="text-body mt-4 leading-relaxed">
              {p}
            </p>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="heading-section text-xl">{sections.workflowTitle}</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-body">
            {sections.workflowSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        {city && (
          <section className="mt-12">
            <h2 className="heading-section text-xl">{sections.marketTitle}</h2>
            {sections.marketParagraphs.map((p) => (
              <p key={p.slice(0, 40)} className="text-body mt-4 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        )}

        <section className="mt-12">
          <h2 className="heading-section text-xl">{sections.pricingTitle}</h2>
          <p className="text-body mt-4 leading-relaxed">{sections.pricingParagraph}</p>
        </section>

        <section className="mt-12">
          <h2 className="heading-section text-xl">{sections.faqTitle}</h2>
          <dl className="mt-4 space-y-6">
            {sections.faq.map((item) => (
              <div key={item.q}>
                <dt className="heading text-sm font-semibold">{item.q}</dt>
                <dd className="text-body mt-2 text-sm leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={ROUTES.inscription} className="ui-btn-primary px-6 py-3">
            Essayer gratuitement
          </Link>
          <Link href={ROUTES.tarifs} className="ui-btn-outline px-6 py-3">
            Voir les tarifs
          </Link>
        </div>

        {!city && (
          <section className="mt-16">
            <h2 className="heading-card">Devis {trade.label.toLowerCase()} par ville</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.values(CITIES).map((c) => (
                <li key={c.slug}>
                  <Link
                    href={localSeoPath(trade.slug, c.slug)}
                    className="ui-list-row block text-sm"
                  >
                    {trade.label} à {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {city && (
          <section className="mt-16">
            <h2 className="heading-card">Autres métiers à {city.label}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {Object.values(TRADES)
                .filter((t) => t.slug !== trade.slug)
                .map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={localSeoPath(t.slug, city.slug)}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--surface-muted)]"
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
            </ul>
            <p className="mt-4 text-sm">
              <Link href={localSeoPath(trade.slug)} className="link-blue hover:underline">
                Voir tous les {trade.plural.toLowerCase()} en France →
              </Link>
            </p>
          </section>
        )}

        <section className="mt-16">
          <h2 className="heading-card">Voir aussi</h2>
          <ul className="mt-4 space-y-2">
            {seeAlso.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-blue text-sm hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
