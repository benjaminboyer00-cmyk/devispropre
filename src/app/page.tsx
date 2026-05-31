import Link from "next/link";
import { TrackLink } from "@/components/analytics/TrackLink";
import { IconDocument, IconEdit, IconShare, IconShield } from "@/components/icons/Icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { ROUTES } from "@/lib/routes";
import { pageMetadata, jsonLdFaq, jsonLdSoftwareApplication, HOME_FAQ, SITE } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Devis facile artisans — pro en 2 min, TVA 2018",
  description:
    "Logiciel de devis facile pour artisans BTP. Comment faire un devis pro depuis votre téléphone : PDF, WhatsApp, facture conforme. Essai 15 jours gratuit.",
  path: "/",
  keywords: ["devis facile", "comment faire un devis", "devis artisan", "logiciel devis BTP"],
});

const REVIEWS = [
  {
    author: "Karim L., plombier — Paris",
    quote: "Mes clients parisiens veulent un PDF, pas un SMS. DevisPropre me fait gagner un créneau par jour.",
  },
  {
    author: "Thomas B., chauffagiste — Lyon",
    quote: "Pendant la saison de chauffe, je n'ai pas le temps d'Excel. Client, prix, envoi — c'est tout.",
  },
  {
    author: "Antoine R., électricien — Marseille",
    quote: "Entre deux chantiers, je fais le devis dans la camionnette. Le client reçoit le lien avant que je reparte.",
  },
] as const;

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
            <span className="font-bold text-brand">
              Pro en 2 minutes, conforme TVA 2018
            </span>
          </h1>
          <p className="text-lead mx-auto mt-8 max-w-2xl font-light">
            Devis facile en 2 minutes · Comment faire un devis pro depuis le chantier · WhatsApp
            &amp; factures dès 19€/mois · Conforme loi anti-fraude TVA 2018 · Essai gratuit 15 jours
          </p>
          <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
            <TrackLink
              href={ROUTES.creerDevis}
              className="ui-btn-primary ui-btn-lg"
              event="CTA Creer Devis"
              eventProps={{ location: "hero" }}
            >
              Créer mon devis gratuit
            </TrackLink>
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

      <section className="section-page">
        <h2 className="heading-section">Guides pour artisans</h2>
        <p className="text-body mt-3 max-w-2xl">
          Vous cherchez comment faire un devis ou un outil de devis facile ? Nos guides pratiques
          couvrent la rédaction, la TVA et l&apos;envoi WhatsApp.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          <li>
            <Link href={ROUTES.guideCommentFaireDevis} className="ui-card-padded block hover:no-underline">
              <p className="heading font-semibold">Comment faire un devis</p>
              <p className="text-body mt-1 text-sm">Guide pas à pas pour artisans et auto-entrepreneurs</p>
            </Link>
          </li>
          <li>
            <Link href={ROUTES.devisFacile} className="ui-card-padded block hover:no-underline">
              <p className="heading font-semibold">Devis facile en 2 minutes</p>
              <p className="text-body mt-1 text-sm">Plus simple qu&apos;Excel — PDF pro et facture conforme</p>
            </Link>
          </li>
        </ul>
      </section>

      <section className="section-page">
        <h2 className="heading-section">Devis par métier</h2>
        <p className="text-body mt-3 max-w-2xl">
          Plombier, électricien, peintre, maçon, couvreur ou chauffagiste — pages dédiées avec
          exemples par ville.
        </p>
        <Link href={ROUTES.devisArtisanHub} className="link-underline mt-4 inline-block font-medium">
          Voir tous les métiers →
        </Link>
      </section>

      <section className="section-page">
        <h2 className="heading-section">Ils gagnent du temps sur le terrain</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-3">
          {REVIEWS.map((r) => (
            <li key={r.author} className="ui-card-padded">
              <p className="text-body text-sm italic leading-relaxed">&ldquo;{r.quote}&rdquo;</p>
              <p className="text-subtle mt-3 text-xs font-medium">{r.author}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section-page">
        <h2 className="heading-section text-center">Questions fréquentes</h2>
        <dl className="mx-auto mt-8 max-w-2xl space-y-6">
          {HOME_FAQ.map((item) => (
            <div key={item.q} className="ui-card-padded">
              <dt className="heading font-semibold">{item.q}</dt>
              <dd className="text-body mt-2 leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="ui-cta-band">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-2xl font-bold leading-snug sm:text-3xl">
            « Vous signez votre premier devis accepté, DevisPropre est rentabilisé pour l&apos;année. »
          </p>
          <Link href={ROUTES.creerDevis} className="ui-btn-inverse ui-btn-lg mt-10">
            Créer mon devis gratuit
          </Link>
        </div>
      </section>
    </>
  );
}
