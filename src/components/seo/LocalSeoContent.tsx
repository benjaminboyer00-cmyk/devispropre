"use client";

import Link from "next/link";
import type { CityMeta, TradeMeta } from "@/lib/local-seo";
import { CITIES, TRADES, localSeoPath } from "@/lib/local-seo";
import { ROUTES } from "@/lib/routes";

interface LocalSeoContentProps {
  trade: TradeMeta;
  city?: CityMeta;
}

export function LocalSeoContent({ trade, city }: LocalSeoContentProps) {
  const heading = city
    ? `Devis et factures ${trade.label.toLowerCase()} à ${city.label}`
    : `Logiciel de devis pour ${trade.plural.toLowerCase()}`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <p className="link-blue text-sm font-medium">
        DevisPropre · {city ? `${city.region}` : "France"}
      </p>
      <h1 className="heading-hero mt-4 text-3xl sm:text-4xl">{heading}</h1>
      <p className="text-lead mt-4 font-light">
        {city
          ? `Artisans ${trade.plural.toLowerCase()} à ${city.label} : créez un devis PDF conforme en 2 minutes depuis votre téléphone.`
          : trade.description}
      </p>

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
        </section>
      )}
    </article>
  );
}
