import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Conformité loi anti-fraude TVA 2018 — Inaltérabilité garantie",
  description:
    "DevisPropre garantit l'inaltérabilité, la sécurisation, la conservation et l'archivage de vos factures conformément à la loi anti-fraude TVA 2018.",
  alternates: { canonical: `${SITE.url}/conformite` },
  keywords: [
    "loi anti-fraude TVA 2018",
    "facturation inaltérable",
    "logiciel facturation artisan conforme",
    "attestation individuelle TVA",
  ],
};

export default function ConformitePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose prose-slate">
      <h1 className="text-3xl font-bold text-slate-900">
        Conformité loi anti-fraude TVA 2018
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        DevisPropre est conçu <strong>secure by design</strong>. L&apos;inaltérabilité des
        données n&apos;est pas une option — c&apos;est le fondement de l&apos;architecture.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Les 4 exigences légales</h2>
        <ul className="mt-4 space-y-3 text-slate-700">
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

      <section className="mt-10 rounded-xl border border-green-200 bg-green-50 p-6">
        <h2 className="text-xl font-semibold text-green-900">Comment ça marche techniquement</h2>
        <ol className="mt-4 space-y-3 text-green-900">
          <li>
            1. <strong>Brouillon</strong> — Modifiable librement (devis ou facture).
          </li>
          <li>
            2. <strong>Verrouillage</strong> — À l&apos;envoi (devis) ou à l&apos;émission
            (facture), le contenu est sérialisé et haché (SHA-256).
          </li>
          <li>
            3. <strong>Chaînage</strong> — Chaque facture émise inclut l&apos;empreinte de la
            précédente, formant une chaîne d&apos;intégrité.
          </li>
          <li>
            4. <strong>Attestation</strong> — PDF d&apos;attestation individuelle généré
            automatiquement à chaque émission.
          </li>
          <li>
            5. <strong>Vérification</strong> — Bouton « Vérifier l&apos;intégrité » recalcule
            le hash et détecte toute altération.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Journal d&apos;audit</h2>
        <p className="mt-2 text-slate-600">
          Chaque action (création, modification, verrouillage, envoi, acceptation, émission,
          paiement, vérification) est tracée avec horodatage, adresse IP et empreinte du
          document au moment de l&apos;action.
        </p>
      </section>

      <div className="mt-10">
        <Link
          href="/inscription"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Essayer DevisPropre gratuitement
        </Link>
      </div>
    </article>
  );
}
