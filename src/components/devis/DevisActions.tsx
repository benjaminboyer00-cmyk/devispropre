"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEuro, devisShareMessage } from "@/lib/format";

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
}

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "📄 Brouillon",
  ENVOYE: "✈️ Envoyé",
  ACCEPTE: "✅ Accepté",
  REFUSE: "❌ Refusé",
  FACTURE: "💰 Facturé",
};

export function DevisActions({ devis }: DevisDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function send() {
    if (!confirm("Envoyer et verrouiller ce devis ? Il ne pourra plus être modifié.")) return;
    setLoading("send");
    await fetch(`/api/devis/${devis.id}/send`, { method: "POST" });
    setLoading("");
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

  const whatsAppHref =
    devis.shareToken && origin
      ? (() => {
          const url = `${origin}/devis/${devis.shareToken}`;
          const msg = devisShareMessage(devis.numero, devis.client.nom, url);
          const phone = devis.client.telephone?.replace(/\D/g, "") ?? "";
          return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : null;
        })()
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
          {STATUS_LABELS[devis.status] ?? devis.status}
        </span>
        {devis.lockedAt && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
            🔒 Verrouillé — inaltérable
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/devis/${devis.id}/pdf`}
          target="_blank"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          {devis.status === "BROUILLON" ? "Prévisualiser le PDF" : "Voir le PDF"}
        </a>

        {devis.status === "BROUILLON" && (
          <button
            onClick={send}
            disabled={!!loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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

        {devis.status === "ACCEPTE" && (
          <button onClick={toFacture} disabled={!!loading} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white">
            Créer la facture
          </button>
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

      <div className="rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="p-3">Description</th>
              <th className="p-3">Qté</th>
              <th className="p-3">P.U.</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l, i) => (
              <tr key={i} className="border-b">
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
