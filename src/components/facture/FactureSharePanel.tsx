"use client";

import { useState } from "react";
import { DocumentSharePanel } from "@/components/devis/DocumentSharePanel";
import { useToast } from "@/components/ui/ToastProvider";
import { factureShareMessage } from "@/lib/format";

interface FactureSharePanelProps {
  factureId: string;
  numero: string;
  clientName: string;
  shareUrl: string;
  clientPhone: string | null;
  clientEmail: string | null;
}

export function FactureSharePanel({
  factureId,
  numero,
  clientName,
  shareUrl,
  clientPhone,
  clientEmail,
}: FactureSharePanelProps) {
  const { toast } = useToast();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const message = factureShareMessage(numero, clientName, shareUrl);
  const email = clientEmail?.trim() ?? "";

  async function handleResendLink() {
    setResendLoading(true);
    const res = await fetch(`/api/factures/${factureId}/resend-link`, { method: "POST" });
    const data = await res.json().catch(() => ({} as { error?: string }));
    setResendLoading(false);

    if (!res.ok) {
      toast(data.error ?? "Impossible de renvoyer la facture.", "error");
      return;
    }

    setResendSent(true);
    toast(`Facture renvoyée à ${email}`, "info");
  }

  return (
    <div className="space-y-4">
      <DocumentSharePanel
        variant="facture"
        title="Facture émise — partagez le lien client"
        subtitle="Partagez le mot « facture » (lien cliquable) — le client consultera le document complet en ligne."
        shareUrl={shareUrl}
        message={message}
        clientPhone={clientPhone}
        emailSubject={`Facture n° ${numero} — ${clientName}`}
      />

      <div className="rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-900 dark:bg-slate-900">
        <p className="text-sm font-semibold">Client perdu le lien ?</p>
        <p className="text-body mt-1 text-sm">
          Renvoyez la facture par email au client avec le lien de consultation en ligne.
        </p>
        {email ? (
          <button
            type="button"
            onClick={handleResendLink}
            disabled={resendLoading || resendSent}
            className="ui-btn-primary mt-3 w-full py-3 text-sm font-semibold"
          >
            {resendLoading ? "Envoi…" : resendSent ? "Facture renvoyée" : "Renvoyer par email au client"}
          </button>
        ) : (
          <p className="text-body mt-3 text-sm">
            Ajoutez l&apos;email du client (depuis un devis ou la fiche client) pour renvoyer la facture
            automatiquement.
          </p>
        )}
      </div>
    </div>
  );
}
