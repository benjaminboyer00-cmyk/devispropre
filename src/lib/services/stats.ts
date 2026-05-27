import { prisma } from "../db";
import { formatEuro } from "../format";
import { assertProFeature } from "../plan-features";
import type { Plan } from "@/generated/prisma/client";

export async function getAdvancedStats(userId: string, plan: Plan) {
  assertProFeature(plan, "Statistiques avancées");

  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    months.push({
      label: start.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      start,
      end,
    });
  }

  const [monthlyCa, topClients, statusBreakdown, avgDelay] = await Promise.all([
    Promise.all(
      months.map(async (m) => {
        const agg = await prisma.facture.aggregate({
          where: {
            userId,
            deletedAt: null,
            status: { in: ["EMISE", "PAYEE"] },
            issuedAt: { gte: m.start, lte: m.end },
          },
          _sum: { totalTTC: true },
          _count: true,
        });
        return {
          label: m.label,
          ca: agg._sum.totalTTC ?? 0,
          factures: agg._count,
        };
      })
    ),
    prisma.facture.groupBy({
      by: ["clientId"],
      where: {
        userId,
        deletedAt: null,
        status: { in: ["EMISE", "PAYEE"] },
        issuedAt: { gte: months[0]!.start },
      },
      _sum: { totalTTC: true },
      _count: true,
      orderBy: { _sum: { totalTTC: "desc" } },
      take: 5,
    }),
    prisma.devis.groupBy({
      by: ["status"],
      where: { userId, deletedAt: null },
      _count: true,
    }),
    prisma.devis.findMany({
      where: {
        userId,
        deletedAt: null,
        status: "ACCEPTE",
        sentAt: { not: null },
        acceptedAt: { not: null },
      },
      select: { sentAt: true, acceptedAt: true },
      take: 200,
    }),
  ]);

  const clientIds = topClients.map((c) => c.clientId);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds }, userId },
    select: { id: true, nom: true },
  });
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.nom]));

  const delays = avgDelay
    .map((d) => {
      if (!d.sentAt || !d.acceptedAt) return null;
      return (d.acceptedAt.getTime() - d.sentAt.getTime()) / (1000 * 60 * 60 * 24);
    })
    .filter((d): d is number => d !== null);

  const avgAcceptDays =
    delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : null;

  return {
    monthlyCa,
    topClients: topClients.map((c) => ({
      nom: clientMap[c.clientId] ?? "Client",
      ca: c._sum.totalTTC ?? 0,
      factures: c._count,
      caFormatted: formatEuro(c._sum.totalTTC ?? 0),
    })),
    devisByStatus: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    avgAcceptDays,
    totalCa6m: monthlyCa.reduce((sum, m) => sum + m.ca, 0),
    totalCa6mFormatted: formatEuro(monthlyCa.reduce((sum, m) => sum + m.ca, 0)),
  };
}

export function statsToCsv(stats: Awaited<ReturnType<typeof getAdvancedStats>>): string {
  const lines = ["Mois;CA TTC;Factures"];
  for (const m of stats.monthlyCa) {
    lines.push(`${m.label};${m.ca.toFixed(2)};${m.factures}`);
  }
  lines.push("");
  lines.push("Client;CA TTC;Factures");
  for (const c of stats.topClients) {
    lines.push(`${c.nom};${c.ca.toFixed(2)};${c.factures}`);
  }
  return lines.join("\n");
}
