"use client";

import { DocumentSharePanel } from "@/components/devis/DocumentSharePanel";
import { factureShareMessage } from "@/lib/format";

interface FactureSharePanelProps {
  numero: string;
  clientName: string;
  shareUrl: string;
  clientPhone: string | null;
}

export function FactureSharePanel({ numero, clientName, shareUrl, clientPhone }: FactureSharePanelProps) {
  const message = factureShareMessage(numero, clientName, shareUrl);

  return (
    <DocumentSharePanel
      variant="facture"
      title="Facture émise — partagez le lien client"
      subtitle="Partagez le mot « facture » (lien cliquable) — le client consultera le document complet en ligne."
      shareUrl={shareUrl}
      message={message}
      clientPhone={clientPhone}
      emailSubject={`Facture n° ${numero} — ${clientName}`}
    />
  );
}
