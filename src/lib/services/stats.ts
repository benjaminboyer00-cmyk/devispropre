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

  const periodStart = months[0]!.start;

  const [monthlyCa, topClientsRaw, statusBreakdown, avgDelay] = await Promise.all([
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
    prisma.$queryRaw<{ nom: string; ca: number; factures: bigint }[]>`
      SELECT c.nom, SUM(f."totalTTC")::float AS ca, COUNT(*)::bigint AS factures
      FROM "Facture" f
      INNER JOIN "Client" c ON c.id = f."clientId" AND c."userId" = f."userId"
      WHERE f."userId" = ${userId}
        AND f."deletedAt" IS NULL
        AND f.status IN ('EMISE', 'PAYEE')
        AND f."issuedAt" >= ${periodStart}
      GROUP BY c.id, c.nom
      ORDER BY ca DESC
      LIMIT 5
    `,
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
    topClients: topClientsRaw.map((c) => ({
      nom: c.nom,
      ca: c.ca,
      factures: Number(c.factures),
      caFormatted: formatEuro(c.ca),
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
