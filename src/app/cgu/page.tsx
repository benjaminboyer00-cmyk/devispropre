import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Conditions générales d'utilisation",
  description: "CGU DevisPropre — conditions d'utilisation du service de devis et factures pour artisans.",
  path: "/cgu",
});

export default function CguPage() {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-16">
      <h1>Conditions générales d&apos;utilisation</h1>
      <p>
        L&apos;utilisation de DevisPropre implique l&apos;acceptation des présentes CGU.
        Le service permet la création de devis et factures conformes à la réglementation française.
      </p>
      <h2>Compte utilisateur</h2>
      <p>
        L&apos;utilisateur est responsable de la exactitude des informations saisies (SIRET, TVA, clients).
      </p>
      <h2>Inaltérabilité</h2>
      <p>
        Les documents verrouillés ne peuvent plus être modifiés — c&apos;est une exigence légale, pas un bug.
      </p>
    </article>
  );
}
