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
      subtitle="Même principe que le devis : lien sécurisé, message pré-rempli, conformité TVA 2018."
      shareUrl={shareUrl}
      message={message}
      clientPhone={clientPhone}
      emailSubject={`Facture n° ${numero} — ${clientName}`}
    />
  );
}
