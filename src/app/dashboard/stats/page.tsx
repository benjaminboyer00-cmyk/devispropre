"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEuro } from "@/lib/format";

interface StatsData {
  monthlyCa: { label: string; ca: number; factures: number }[];
  topClients: { nom: string; caFormatted: string; factures: number }[];
  devisByStatus: { status: string; count: number }[];
  avgAcceptDays: number | null;
  totalCa6mFormatted: string;
}

export default function StatsPageClient() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Erreur");
        setStats(data);
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

  if (!stats) return <p className="p-8 text-center text-subtle">Chargement…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <Link href="/dashboard" className="link-blue text-sm">
        ← Dashboard
      </Link>
      <h1 className="heading-section mt-4">Statistiques avancées</h1>
      <p className="text-body mt-2">Plan Pro — 6 derniers mois</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="/api/stats?format=csv" className="ui-btn-outline text-sm">
          Exporter CSV
        </a>
        <Link href="/dashboard/audit" className="ui-btn-outline text-sm">
          Journal d&apos;audit
        </Link>
      </div>

      <div className="ui-stat mt-8">
        <p className="text-subtle text-sm">CA total 6 mois</p>
        <p className="heading mt-1 text-2xl">{stats.totalCa6mFormatted}</p>
        {stats.avgAcceptDays !== null && (
          <p className="text-body mt-2 text-sm">
            Délai moyen d&apos;acceptation : {stats.avgAcceptDays} jours
          </p>
        )}
      </div>

      <section className="mt-10">
        <h2 className="heading-card">CA mensuel</h2>
        <ul className="ui-list mt-4">
          {stats.monthlyCa.map((m) => (
            <li key={m.label} className="ui-list-row">
              <span className="heading font-medium capitalize">{m.label}</span>
              <span>
                {formatEuro(m.ca)} · {m.factures} facture{m.factures > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="heading-card">Top clients</h2>
        <ul className="ui-list mt-4">
          {stats.topClients.map((c) => (
            <li key={c.nom} className="ui-list-row">
              <span>{c.nom}</span>
              <span>
                {c.caFormatted} · {c.factures} facture{c.factures > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="heading-card">Devis par statut</h2>
        <ul className="ui-list mt-4">
          {stats.devisByStatus.map((s) => (
            <li key={s.status} className="ui-list-row">
              <span>{s.status}</span>
              <span className="heading font-medium">{s.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
