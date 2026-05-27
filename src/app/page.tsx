import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, jsonLdFaq, jsonLdSoftwareApplication, SITE } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Devis & factures pour artisans en 2 minutes",
  description: SITE.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={jsonLdSoftwareApplication()} />
      <JsonLd data={jsonLdFaq()} />

      <section className="hero-gradient px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground">
            {SITE.tagline}
          </p>
          <h1 className="page-title mt-5">
            Logiciel de devis et factures pour artisans
            <br />
            <span className="text-primary">Pro en 2 minutes, conforme TVA 2018</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Devis en 2 minutes · Envoi WhatsApp · Facture conforme loi anti-fraude TVA 2018.
            À partir de 19€/mois, sans engagement.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/inscription" className="btn-primary px-8 py-4 text-base shadow-md">
              Je veux gagner du temps et paraître plus pro
            </Link>
            <p className="text-sm text-muted-foreground">
              Ou appelez Benjamin Boyer au{" "}
              <a href={`tel:+${SITE.phoneRaw}`} className="link-primary">{SITE.phone}</a>
            </p>
          </div>
        </div>
      </section>

      <section className="page-shell max-w-4xl">
        <h2 className="section-title">Le problème, cru</h2>
        <blockquote className="mt-5 border-l-4 border-primary pl-5 text-muted-foreground italic">
          « Je fais des devis sur papier ou Word. Je les perds. Les clients les oublient.
          Je ne sais plus qui a accepté ou refusé. Et je passe pour un amateur face aux
          grandes entreprises. »
        </blockquote>
        <p className="mt-4 text-foreground/90">
          DevisPropre a été bâti pour tuer ces frustrations. Aucune formation. Aucun jargon.
          Juste votre téléphone et 2 minutes.
        </p>
      </section>

      <section className="border-y border-border bg-card px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="section-title">Du chantier au client en 120 secondes</h2>
          <ol className="mt-10 space-y-8">
            {[
              { step: "1", title: "Tapez vos prestations", desc: "Client, description, quantité, prix — le TTC se calcule tout seul." },
              { step: "2", title: "Générez le PDF pro", desc: "Logo, SIRET, mentions légales — design impeccable." },
              { step: "3", title: "Envoyez par WhatsApp", desc: "Un clic, message pré-rempli, lien unique. Le client valide en ligne." },
            ].map((item) => (
              <li key={item.step} className="flex gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-muted-foreground">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="page-shell max-w-4xl">
        <h2 className="section-title">Le bouclier légal invisible</h2>
        <p className="mt-4 text-muted-foreground">
          Conformité loi anti-fraude TVA 2018 : verrouillage automatique, empreinte SHA-256,
          chaînage des factures, audit log complet, attestation individuelle générée.
        </p>
        <Link href="/conformite" className="link-primary mt-5 inline-block">
          En savoir plus sur la conformité →
        </Link>
      </section>

      <section className="bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-2xl font-bold leading-snug">
            « Vous signez votre premier devis accepté, DevisPropre est rentabilisé pour l&apos;année. »
          </p>
          <Link
            href="/inscription"
            className="mt-8 inline-block rounded-xl bg-card px-8 py-4 font-semibold text-primary shadow-lg transition hover:brightness-105"
          >
            Essai gratuit — 30 jours
          </Link>
        </div>
      </section>
    </>
  );
}
