"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GuestDevisDocument } from "@/components/devis/GuestDevisDocument";
import { WorkflowDevisFacture } from "@/components/devis/WorkflowDevisFacture";
import { formatDraftSavedAt } from "@/lib/format-draft-saved-at";
import { loadGuestDraft } from "@/lib/guest-devis-draft";
import { ROUTES } from "@/lib/routes";
import type { StoredGuestDraft } from "@/lib/guest-devis-draft";

export function GuestDevisPreview() {
  const [draft, setDraft] = useState<StoredGuestDraft | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture localStorage au montage (SSR-safe)
    setDraft(loadGuestDraft());
  }, []);

  if (!draft) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="heading-section text-2xl">Aucun devis en cours</h1>
        <p className="text-body mt-4">Créez votre devis en 2 minutes — brouillon sauvegardé sur votre appareil.</p>
        <Link href={ROUTES.creerDevis} className="ui-btn-primary mt-8 inline-flex px-8 py-3">
          Créer un devis
        </Link>
      </div>
    );
  }

  const savedLabel = formatDraftSavedAt(draft.savedAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
      <p className="heading-sub text-center">Étape 1 sur 4 — votre devis est prêt</p>
      <h1 className="heading-hero mt-4 text-center text-3xl">Aperçu de votre devis</h1>
      <p className="text-lead mx-auto mt-4 max-w-lg text-center font-light">
        Rendu client ci-dessous. Créez un compte pour conserver ce devis, obtenir le PDF et le lien
        de partage — puis la <strong className="font-medium">facture conforme</strong> après acceptation.
      </p>
      {savedLabel && (
        <p className="text-subtle mt-3 text-center text-xs">
          Sauvegardé sur cet appareil · {savedLabel}
        </p>
      )}

      <div className="mt-10">
        <GuestDevisDocument draft={draft} />
      </div>

      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] p-4 text-sm">
        <p className="heading font-semibold">Après inscription, vous pourrez :</p>
        <ul className="text-body mt-2 list-inside list-disc space-y-1">
          <li>Envoyer le devis (lien + WhatsApp, SMS, email)</li>
          <li>Marquer accepté / refusé par le client</li>
          <li>Créer et émettre la facture en 1 clic — loi anti-fraude TVA 2018</li>
        </ul>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <Link href={`${ROUTES.inscription}?from=devis`} className="ui-btn-primary ui-btn-lg w-full max-w-md text-center">
          Créer mon compte — conserver ce devis
        </Link>
        <Link href={`${ROUTES.inscription}?from=facture`} className="link-underline text-sm font-medium">
          Je veux surtout facturer — même compte, devis + factures
        </Link>
        <Link href={`${ROUTES.connexion}?from=devis`} className="link-underline text-sm">
          Déjà inscrit ? Se connecter
        </Link>
        <Link href={ROUTES.creerDevis} className="text-subtle text-xs hover:underline">
          Modifier le devis
        </Link>
      </div>

      <WorkflowDevisFacture compact />

      <ol className="text-body mx-auto mt-10 max-w-md space-y-3 text-sm">
        <li className="flex gap-3">
          <span className="heading font-bold text-[var(--accent)]">1.</span>
          <span>Compte — devis sauvegardé sur votre espace</span>
        </li>
        <li className="flex gap-3">
          <span className="heading font-bold text-[var(--accent)]">2.</span>
          <span>Essai Starter — PDF et envoi client</span>
        </li>
        <li className="flex gap-3">
          <span className="heading font-bold text-[var(--accent)]">3.</span>
          <span>Partage — lien, WhatsApp, SMS ou email</span>
        </li>
        <li className="flex gap-3">
          <span className="heading font-bold text-[var(--accent)]">4.</span>
          <span>Facture émise — devis accepté, zéro ressaisie</span>
        </li>
      </ol>
    </div>
  );
}
