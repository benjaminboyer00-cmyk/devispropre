import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/format";
import { getDevisStatusEmoji, getDevisStatusLabel } from "@/lib/services/devis";
import { getFactureStatusLabel } from "@/lib/services/facture";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false },
};

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/connexion");

  const [devis, factures] = await Promise.all([
    prisma.devis.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.facture.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bonjour, {user.name}</h1>
          <p className="text-slate-600">Votre carnet à souches numérique</p>
        </div>
        <Link
          href="/dashboard/devis/nouveau"
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          + Nouveau devis
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { emoji: "📄", label: "Brouillon", desc: "En cours" },
          { emoji: "✈️", label: "Envoyé", desc: "Client notifié" },
          { emoji: "✅", label: "Accepté", desc: "À facturer" },
          { emoji: "💰", label: "Facturé", desc: "Conforme & verrouillé" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-2xl">{s.emoji}</span>
            <p className="mt-2 font-semibold">{s.label}</p>
            <p className="text-xs text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Devis récents</h2>
        {devis.length === 0 ? (
          <p className="mt-4 text-slate-500">Aucun devis — créez-en un en 2 minutes.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border border-slate-200 bg-white">
            {devis.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/dashboard/devis/${d.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <span className="font-medium">{d.numero}</span>
                    <span className="ml-2 text-sm text-slate-500">{d.client.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm">
                      {getDevisStatusEmoji(d.status)} {getDevisStatusLabel(d.status)}
                    </span>
                    <p className="font-medium">{formatEuro(d.totalTTC)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Factures</h2>
        {factures.length === 0 ? (
          <p className="mt-4 text-slate-500">Les factures apparaissent après acceptation d&apos;un devis.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border border-slate-200 bg-white">
            {factures.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/dashboard/factures/${f.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <span className="font-medium">{f.numero}</span>
                    <span className="ml-2 text-sm text-slate-500">{f.client.nom}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm">{getFactureStatusLabel(f.status)}</span>
                    <p className="font-medium">{formatEuro(f.totalTTC)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
