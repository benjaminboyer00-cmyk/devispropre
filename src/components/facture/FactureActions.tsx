"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatEuro } from "@/lib/format";

interface FactureDetailProps {
  facture: {
    id: string;
    numero: string;
    status: string;
    totalTTC: number;
    lockedAt: string | null;
    contentHash: string | null;
    chainHash: string | null;
    client: { nom: string };
    lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number }[];
    attestation: { numero: string } | null;
  };
}

export function FactureActions({ facture }: FactureDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function issue() {
    setLoading("issue");
    await fetch(`/api/factures/${facture.id}`, { method: "POST" });
    setLoading("");
    router.refresh();
  }

  async function pay() {
    setLoading("pay");
    await fetch(`/api/factures/${facture.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay" }),
    });
    setLoading("");
    router.refresh();
  }

  async function cancelDraft() {
    setLoading("cancel");
    await fetch(`/api/factures/${facture.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    setLoading("");
    setConfirmCancel(false);
    router.refresh();
  }

  async function verify() {
    const res = await fetch(`/api/factures/${facture.id}/verify`);
    const data = await res.json();
    setVerifyResult(data.valid);
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={confirmCancel}
        title="Annuler le brouillon ?"
        message="Ce brouillon de facture sera définitivement annulé. Cette action est irréversible."
        confirmLabel="Annuler le brouillon"
        variant="danger"
        loading={loading === "cancel"}
        onConfirm={cancelDraft}
        onCancel={() => setConfirmCancel(false)}
      />

      <div className="flex flex-wrap gap-2">
        {facture.status === "BROUILLON" && (
          <>
            <button
              onClick={issue}
              disabled={!!loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Émettre & verrouiller (conformité TVA)
            </button>
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={!!loading}
              className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-700"
            >
              Annuler le brouillon
            </button>
          </>
        )}
        {facture.status === "EMISE" && (
          <button onClick={pay} disabled={!!loading} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white">
            Marquer payée
          </button>
        )}
        <a href={`/api/factures/${facture.id}/pdf`} target="_blank" className="rounded-lg border px-4 py-2 text-sm">
          Voir le PDF
        </a>
        {facture.contentHash && (
          <button onClick={verify} className="rounded-lg border px-4 py-2 text-sm">
            Vérifier l&apos;intégrité
          </button>
        )}
      </div>

      {facture.lockedAt && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">
          🔒 Facture verrouillée — inaltérable (loi anti-fraude TVA 2018)
        </p>
      )}

      {facture.attestation && (
        <p className="text-sm text-slate-600">
          Attestation de conformité : {facture.attestation.numero}
        </p>
      )}

      {verifyResult !== null && (
        <p className={`text-sm ${verifyResult ? "text-green-700" : "text-red-700"}`}>
          {verifyResult ? "✓ Chaîne d'intégrité valide" : "✗ Altération détectée"}
        </p>
      )}

      {facture.contentHash && (
        <p className="break-all font-mono text-xs text-slate-400">
          Hash : {facture.contentHash.slice(0, 32)}…
          {facture.chainHash && ` · Chaîne : ${facture.chainHash.slice(0, 16)}…`}
        </p>
      )}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <tbody>
            {facture.lignes.map((l, i) => (
              <tr key={i} className="border-b">
                <td className="p-3">{l.description}</td>
                <td className="p-3 text-right">{formatEuro(l.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-right font-bold">{formatEuro(facture.totalTTC)} TTC</div>
      </div>
    </div>
  );
}

export function FacturePageWrapper({ facture }: FactureDetailProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Retour
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Facture {facture.numero}</h1>
      <p className="text-slate-600">Client : {facture.client.nom}</p>
      <div className="mt-8">
        <FactureActions facture={facture} />
      </div>
    </div>
  );
}
