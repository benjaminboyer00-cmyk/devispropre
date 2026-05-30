"use client";

import { DocumentSharePanel } from "@/components/devis/DocumentSharePanel";
import { devisShareMessage } from "@/lib/format";

interface DevisSharePanelProps {
  numero: string;
  clientName: string;
  shareUrl: string;
  clientPhone: string | null;
}

export function DevisSharePanel({ numero, clientName, shareUrl, clientPhone }: DevisSharePanelProps) {
  const message = devisShareMessage(numero, clientName, shareUrl);

  return (
    <DocumentSharePanel
      variant="devis"
      title="Lien client prêt — partagez votre devis"
      subtitle="Partagez le mot « devis » (lien cliquable) — le client pourra consulter et signer en ligne."
      shareUrl={shareUrl}
      message={message}
      clientPhone={clientPhone}
      emailSubject={`Devis n° ${numero} — ${clientName}`}
    />
  );
}
