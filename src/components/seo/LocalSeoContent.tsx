import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import type { CityMeta, TradeMeta } from "@/lib/local-seo";
import {
  CITIES,
  TRADES,
  getLocalBreadcrumbs,
  getLocalSeeAlsoLinks,
  getLocalTestimonial,
  getLocalUniqueInsight,
  localSeoPath,
} from "@/lib/local-seo";
import { ROUTES } from "@/lib/routes";
import { jsonLdBreadcrumbList, jsonLdLocalBusiness } from "@/lib/seo";

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

  return (
    <>
      <JsonLd data={jsonLdBreadcrumbList(breadcrumbs)} />
      {city && (
        <JsonLd
          data={jsonLdLocalBusiness(trade.label, city.label, city.region)}
        />
      )}

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

        <ul className="mt-8 space-y-3 text-body">
          <li>✓ Devis PDF avec SIRET et mentions légales</li>
          <li>✓ Partage WhatsApp (plan Starter)</li>
          <li>✓ Facturation conforme loi anti-fraude TVA 2018</li>
          <li>✓ Connexion par lien email — sans mot de passe</li>
        </ul>

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
