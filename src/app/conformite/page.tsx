import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Conformité loi anti-fraude TVA 2018 — Inaltérabilité garantie",
  description:
    "DevisPropre garantit l'inaltérabilité, la sécurisation, la conservation et l'archivage de vos factures conformément à la loi anti-fraude TVA 2018.",
  path: "/conformite",
  keywords: [
    "loi anti-fraude TVA 2018",
    "facturation inaltérable",
    "logiciel facturation artisan conforme",
    "attestation individuelle TVA",
    ...["devis artisan", "facture artisan"],
  ],
});

export default function ConformitePage() {
  return (
    <article className="prose-legal mx-auto max-w-3xl px-4 py-16">
      <h1>Conformité loi anti-fraude TVA 2018</h1>
      <p className="mt-4 text-lg">
        DevisPropre est conçu <strong>secure by design</strong>. L&apos;inaltérabilité des
        données n&apos;est pas une option — c&apos;est le fondement de l&apos;architecture.
      </p>

      <section className="mt-10">
        <h2>Les 4 exigences légales</h2>
        <ul className="mt-4 space-y-3">
          <li>
            <strong>Inaltérabilité</strong> — Une facture émise est verrouillée définitivement.
            Aucune modification du contenu n&apos;est possible.
          </li>
          <li>
            <strong>Sécurisation</strong> — Empreinte SHA-256 calculée à l&apos;émission.
            Chaînage cryptographique entre factures successives.
          </li>
          <li>
            <strong>Conservation</strong> — Soft delete uniquement. Aucune suppression
            définitive des documents fiscaux.
          </li>
          <li>
            <strong>Archivage</strong> — Journal d&apos;audit complet : qui, quoi, quand,
            empreinte au moment de l&apos;action.
          </li>
        </ul>
      </section>

      <section className="ui-alert-success mt-10 rounded-xl border border-green-200 p-6 dark:border-green-800">
        <h2 className="text-xl font-semibold text-green-900 dark:text-green-200">Comment ça marche techniquement</h2>
        <ol className="mt-4 space-y-3 text-green-900 dark:text-green-100">
          <li>1. <strong>Brouillon</strong> — Modifiable librement (devis ou facture).</li>
          <li>2. <strong>Verrouillage</strong> — Contenu sérialisé et haché (SHA-256).</li>
          <li>3. <strong>Chaînage</strong> — Empreinte de la facture précédente incluse.</li>
          <li>4. <strong>Attestation</strong> — PDF généré automatiquement à chaque émission.</li>
          <li>5. <strong>Vérification</strong> — Recalcul du hash, détection d&apos;altération.</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2>Journal d&apos;audit</h2>
        <p className="mt-2">
          Chaque action est tracée avec horodatage, adresse IP et empreinte du document au moment
          de l&apos;action.
        </p>
      </section>

      <div className="mt-10">
        <Link href="/inscription" className="ui-btn-primary px-6 py-3">
          Essayer DevisPropre gratuitement
        </Link>
      </div>
    </article>
  );
}
