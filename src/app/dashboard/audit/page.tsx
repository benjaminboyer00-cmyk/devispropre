"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AuditEntry {
  id: string;
  actionLabel: string;
  entityType: string;
  entityId: string;
  contentHash: string | null;
  createdAt: string;
}

export default function AuditJournalPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/audit/journal")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Erreur");
        setEntries(data.entries ?? []);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="ui-alert-error">{error}</p>
        <Link href="/tarifs" className="link-underline mt-4 inline-block">
          Passer au plan Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <Link href="/dashboard" className="link-blue text-sm">
        ← Dashboard
      </Link>
      <h1 className="heading-section mt-4">Journal d&apos;audit complet</h1>
      <p className="text-body mt-2">Plan Pro — traçabilité de toutes les actions sur votre espace.</p>

      <div className="mt-6">
        <a href="/api/audit/journal?format=csv" className="ui-btn-outline text-sm">
          Exporter CSV
        </a>
      </div>

      {entries.length === 0 ? (
        <p className="text-subtle mt-8">Aucune entrée pour le moment.</p>
      ) : (
        <ul className="ui-list mt-8">
          {entries.map((e) => (
            <li key={e.id} className="ui-list-row flex-col items-start gap-1 sm:flex-row sm:items-center">
              <div>
                <span className="heading text-sm font-medium">{e.actionLabel}</span>
                <span className="text-subtle ml-2 text-xs">
                  {e.entityType} · {e.entityId.slice(0, 8)}…
                </span>
              </div>
              <div className="text-subtle text-xs">
                {new Date(e.createdAt).toLocaleString("fr-FR")}
                {e.contentHash && ` · hash ${e.contentHash}…`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
