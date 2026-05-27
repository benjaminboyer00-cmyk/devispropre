"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEuro, devisShareMessage } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DevisDetailProps {
  devis: {
    id: string;
    numero: string;
    status: string;
    totalTTC: number;
    lockedAt: string | null;
    contentHash: string | null;
    shareToken: string | null;
    client: { nom: string; telephone: string | null };
    lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number }[];
  };
  plan: string;
}

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "📄 Brouillon",
  ENVOYE: "✈️ Envoyé",
  ACCEPTE: "✅ Accepté",
  REFUSE: "❌ Refusé",
  FACTURE: "💰 Facturé",
};

export function DevisActions({ devis, plan }: DevisDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [origin, setOrigin] = useState("");
  const [confirmSend, setConfirmSend] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function send() {
    setLoading("send");
    await fetch(`/api/devis/${devis.id}/send`, { method: "POST" });
    setLoading("");
    setConfirmSend(false);
    router.refresh();
  }

  async function setStatus(status: "ACCEPTE" | "REFUSE") {
    setLoading(status);
    await fetch(`/api/devis/${devis.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading("");
    router.refresh();
  }

  async function toFacture() {
    setLoading("facture");
    const res = await fetch("/api/factures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devisId: devis.id }),
    });
    const facture = await res.json();
    setLoading("");
    if (res.ok) router.push(`/dashboard/factures/${facture.id}`);
  }

  async function verify() {
    const res = await fetch(`/api/devis/${devis.id}/verify`);
    const data = await res.json();
    setVerifyResult(data.valid);
  }

  const starterPlus = plan === "STARTER" || plan === "PRO";

  const whatsAppHref =
    starterPlus && devis.shareToken && origin
      ? (() => {
          const url = `${origin}/devis/${devis.shareToken}`;
          const msg = devisShareMessage(devis.numero, devis.client.nom, url);
          const phone = devis.client.telephone?.replace(/\D/g, "") ?? "";
          return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : null;
        })()
      : null;

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={confirmSend}
        title="Envoyer et verrouiller ?"
        message="Une fois envoyé, ce devis ne pourra plus être modifié (conformité légale). Un lien client sera généré."
        confirmLabel="Envoyer"
        loading={loading === "send"}
        onConfirm={send}
        onCancel={() => setConfirmSend(false)}
      />

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800 dark:text-slate-200">
          {STATUS_LABELS[devis.status] ?? devis.status}
        </span>
        {devis.lockedAt && (
          <span className="ui-alert-success inline-block rounded-full px-3 py-1 text-sm">
            🔒 Verrouillé — inaltérable
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/devis/${devis.id}/pdf`}
          target="_blank"
          className="ui-btn-outline text-sm"
        >
          {devis.status === "BROUILLON" ? "Prévisualiser le PDF" : "Voir le PDF"}
        </a>

        {devis.status === "BROUILLON" && (
          <button
            onClick={() => setConfirmSend(true)}
            disabled={!!loading}
            className="ui-btn-primary text-sm"
          >
            Envoyer & verrouiller
          </button>
        )}

        {devis.status === "ENVOYE" && whatsAppHref && (
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Partager sur WhatsApp
          </a>
        )}

        {devis.status === "ENVOYE" && !starterPlus && (
          <Link href="/tarifs" className="ui-btn-outline text-sm">
            WhatsApp — plan Starter
          </Link>
        )}

        {devis.status === "ENVOYE" && (
          <>
            <button onClick={() => setStatus("ACCEPTE")} disabled={!!loading} className="rounded-lg border border-green-600 px-4 py-2 text-sm text-green-700">
              Marquer accepté
            </button>
            <button onClick={() => setStatus("REFUSE")} disabled={!!loading} className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-700">
              Marquer refusé
            </button>
          </>
        )}

        {devis.status === "ACCEPTE" && starterPlus && (
          <button onClick={toFacture} disabled={!!loading} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white">
            Créer la facture
          </button>
        )}

        {devis.status === "ACCEPTE" && !starterPlus && (
          <Link href="/tarifs" className="ui-btn-outline text-sm">
            Facturation — plan Starter
          </Link>
        )}

        {devis.contentHash && (
          <button onClick={verify} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Vérifier l&apos;intégrité
          </button>
        )}
      </div>

      {verifyResult !== null && (
        <p className={`text-sm ${verifyResult ? "text-green-700" : "text-red-700"}`}>
          {verifyResult ? "✓ Document intact — aucune altération détectée" : "✗ Altération détectée — contactez le support"}
        </p>
      )}

      {devis.contentHash && (
        <p className="break-all font-mono text-xs text-slate-400">
          Hash : {devis.contentHash.slice(0, 32)}…
        </p>
      )}

      <div className="ui-list overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
              <th className="p-3">Description</th>
              <th className="p-3">Qté</th>
              <th className="p-3">P.U.</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                <td className="p-3">{l.description}</td>
                <td className="p-3">{l.quantite}</td>
                <td className="p-3">{formatEuro(l.prixUnitaireHT)}</td>
                <td className="p-3">{formatEuro(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-right font-bold">{formatEuro(devis.totalTTC)} TTC</div>
      </div>
    </div>
  );
}
