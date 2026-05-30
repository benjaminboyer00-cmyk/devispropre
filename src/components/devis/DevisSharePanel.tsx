"use client";

import { DocumentSharePanel } from "@/components/devis/DocumentSharePanel";
import { buildDevisShareMessage } from "@/lib/share-utils";

interface DevisSharePanelProps {
  numero: string;
  clientName: string;
  shareUrl: string;
  clientPhone: string | null;
}

export function DevisSharePanel({ numero, clientName, shareUrl, clientPhone }: DevisSharePanelProps) {
  const shareMessage = buildDevisShareMessage(numero, clientName, shareUrl);

  return (
    <DocumentSharePanel
      variant="devis"
      title="Lien client prêt — partagez votre devis"
      subtitle="Partagez le mot « devis » (lien cliquable) — le client pourra consulter et signer en ligne."
      shareUrl={shareUrl}
      shareMessage={shareMessage}
      clientPhone={clientPhone}
      emailSubject={`Devis n° ${numero} — ${clientName}`}
    />
  );
}
