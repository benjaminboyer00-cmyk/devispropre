"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clearClaimError, loadClaimError } from "@/lib/guest-draft-claim-error";
import { ROUTES } from "@/lib/routes";

export function DevisStatusBanner() {
  const searchParams = useSearchParams();
  const claimed = searchParams.get("claimed") === "1";
  const ready = searchParams.get("ready") === "1";
  const needsActivation = searchParams.get("needsActivation") === "1";
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    const err = loadClaimError();
    if (err) {
      setClaimError(err);
      clearClaimError();
    }
  }, []);

  if (claimError) {
    return (
      <div className="ui-alert-error mb-6 text-sm">
        <p>{claimError}</p>
        <Link href={ROUTES.creerDevisApercu} className="link-underline mt-2 inline-block font-medium">
          Retourner à l&apos;aperçu du devis
        </Link>
      </div>
    );
  }

  if (!claimed && !ready && !needsActivation) return null;

  if (ready) {
    return (
      <div className="ui-alert-success mb-6 space-y-2 text-sm">
        <p className="font-semibold">Votre devis est prêt.</p>
        <p>
          Envoyez-le au client pour obtenir le lien de partage. Une fois accepté, créez la facture
          conforme en 1 clic.
        </p>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="ui-alert-success mb-6 space-y-2 text-sm">
        <p className="font-semibold">Votre devis a bien été enregistré sur votre compte.</p>
        <p>Activez l&apos;essai si besoin, puis envoyez-le pour obtenir le lien client.</p>
      </div>
    );
  }

  return (
    <div className="ui-alert-success mb-6 space-y-2 text-sm">
      <p className="font-semibold">Devis enregistré — dernière étape.</p>
      <p>
        Activez l&apos;essai Starter pour obtenir le PDF, le lien client et le partage WhatsApp.{" "}
        <Link href={ROUTES.dashboardActiver} className="link-underline font-medium">
          Choisir mon abonnement →
        </Link>
      </p>
    </div>
  );
}
