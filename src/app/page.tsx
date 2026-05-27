import Link from "next/link";
import { pageMetadata, jsonLdFaq, jsonLdSoftwareApplication, SITE } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Devis & factures pour artisans en 2 minutes",
  description: SITE.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApplication()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq()) }}
      />
      <section className="bg-gradient-to-b from-blue-50 to-white px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
            {SITE.tagline}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Logiciel de devis et factures pour artisans
            <br />
            <span className="text-blue-600">Pro en 2 minutes, conforme TVA 2018</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Devis en 2 minutes · Envoi WhatsApp · Facture conforme loi anti-fraude TVA 2018.
            À partir de 19€/mois, sans engagement.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/inscription"
              className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-blue-700"
            >
              Je veux gagner du temps et paraître plus pro
            </Link>
            <p className="text-sm text-slate-500">
              Ou appelez Benjamin Boyer au{" "}
              <a href={`tel:+${SITE.phoneRaw}`} className="text-blue-600 hover:underline">{SITE.phone}</a>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900">Le problème, cru</h2>
        <blockquote className="mt-4 border-l-4 border-blue-600 pl-4 text-slate-600 italic">
          « Je fais des devis sur papier ou Word. Je les perds. Les clients les oublient.
          Je ne sais plus qui a accepté ou refusé. Et je passe pour un amateur face aux
          grandes entreprises. »
        </blockquote>
        <p className="mt-4 text-slate-700">
          DevisPropre a été bâti pour tuer ces frustrations. Aucune formation. Aucun jargon.
          Juste votre téléphone et 2 minutes.
        </p>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold">Du chantier au client en 120 secondes</h2>
          <ol className="mt-8 space-y-6">
            {[
              {
                step: "1",
                title: "Tapez vos prestations",
                desc: "Client, description, quantité, prix — le TTC se calcule tout seul.",
              },
              {
                step: "2",
                title: "Générez le PDF pro",
                desc: "Logo, SIRET, mentions légales — design impeccable.",
              },
              {
                step: "3",
                title: "Envoyez par WhatsApp",
                desc: "Un clic, message pré-rempli, lien unique. Le client valide en ligne.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-bold">Le bouclier légal invisible</h2>
        <p className="mt-4 text-slate-600">
          Conformité loi anti-fraude TVA 2018 : verrouillage automatique, empreinte SHA-256,
          chaînage des factures, audit log complet, attestation individuelle générée.
        </p>
        <Link href="/conformite" className="mt-4 inline-block text-blue-600 hover:underline">
          En savoir plus sur la conformité →
        </Link>
      </section>

      <section className="bg-blue-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-2xl font-bold">
            « Vous signez votre premier devis accepté, DevisPropre est rentabilisé pour l&apos;année. »
          </p>
          <Link
            href="/inscription"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 hover:bg-blue-50"
          >
            Essai gratuit — 30 jours
          </Link>
        </div>
      </section>
    </>
  );
}
