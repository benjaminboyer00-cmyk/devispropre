import Link from "next/link";
import { IconDocument, IconEdit, IconShare, IconShield } from "@/components/icons/Icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, jsonLdFaq, jsonLdSoftwareApplication, SITE } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Devis et factures pour artisans en 2 minutes",
  description: SITE.description,
  path: "/",
});

const STEPS = [
  {
    icon: IconEdit,
    title: "Tapez vos prestations",
    desc: "Client, description, quantité, prix — le TTC se calcule tout seul.",
  },
  {
    icon: IconDocument,
    title: "Générez le PDF pro",
    desc: "Logo, SIRET, mentions légales — design impeccable.",
  },
  {
    icon: IconShare,
    title: "Partagez par WhatsApp",
    desc: "Plan Starter : 1 clic, message pré-rempli, lien unique. Le client valide en ligne.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <JsonLd data={jsonLdSoftwareApplication()} />
      <JsonLd data={jsonLdFaq()} />

      <section className="hero-section">
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="heading-sub">{SITE.tagline}</p>
          <h1 className="heading-hero mt-5">
            Logiciel de devis et factures pour artisans
            <br />
            <span className="font-bold" style={{ color: "var(--blue)" }}>
              Pro en 2 minutes, conforme TVA 2018
            </span>
          </h1>
          <p className="text-lead mx-auto mt-8 max-w-2xl font-light">
            Devis en 2 minutes · WhatsApp & factures dès 19€/mois · Conforme loi anti-fraude TVA 2018.
            Essai gratuit 30 jours.
          </p>
          <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
            <Link href="/inscription" className="ui-btn-primary ui-btn-lg">
              Je veux gagner du temps et paraître plus pro
            </Link>
            <p className="text-subtle text-sm font-normal">
              Ou appelez Benjamin Boyer au{" "}
              <a href={`tel:+${SITE.phoneRaw}`} className="link-underline font-medium">
                {SITE.phone}
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="section-page">
        <h2 className="heading-section">Le problème, cru</h2>
        <blockquote className="ui-blockquote">
          « Je fais des devis sur papier ou Word. Je les perds. Les clients les oublient.
          Je ne sais plus qui a accepté ou refusé. Et je passe pour un amateur face aux
          grandes entreprises. »
        </blockquote>
        <p className="text-lead mt-6 font-normal">
          DevisPropre a été bâti pour tuer ces frustrations. Aucune formation. Aucun jargon.
          Juste votre téléphone et 2 minutes.
        </p>
      </section>

      <section className="section-surface bg-dots">
        <div className="mx-auto max-w-4xl">
          <h2 className="heading-section">Du chantier au client en 120 secondes</h2>
          <p className="text-body mt-3 font-light">Comment ça marche — en 3 étapes simples.</p>
          <ol className="mt-12 space-y-10">
            {STEPS.map((item, i) => (
              <li key={item.title} className="flex gap-5 sm:gap-6">
                <div className="ui-step-icon">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="pt-1">
                  <p className="text-subtle text-xs font-medium uppercase tracking-wider">
                    Étape {i + 1}
                  </p>
                  <h3 className="heading-card mt-1">{item.title}</h3>
                  <p className="text-body mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-page">
        <div className="flex items-start gap-4">
          <div className="ui-step-icon hidden sm:flex">
            <IconShield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="heading-section">Le bouclier légal invisible</h2>
            <p className="text-lead mt-4 font-normal leading-relaxed">
              Conformité loi anti-fraude TVA 2018 : verrouillage automatique, empreinte SHA-256,
              chaînage des factures, audit log complet, attestation individuelle générée.
            </p>
            <Link href="/conformite" className="link-underline mt-6 inline-block font-medium">
              En savoir plus sur la conformité →
            </Link>
          </div>
        </div>
      </section>

      <section className="ui-cta-band">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-2xl font-bold leading-snug sm:text-3xl">
            « Vous signez votre premier devis accepté, DevisPropre est rentabilisé pour l&apos;année. »
          </p>
          <Link href="/inscription" className="ui-btn-inverse ui-btn-lg mt-10">
            Essai gratuit — 30 jours
          </Link>
        </div>
      </section>
    </>
  );
}
