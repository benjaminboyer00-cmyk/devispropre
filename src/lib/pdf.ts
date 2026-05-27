import { formatEuro, formatDate } from "@/lib/format";
import type { Company, Devis, DevisLigne, Client, Facture, FactureLigne } from "@/generated/prisma/client";

type DevisDoc = Devis & { lignes: DevisLigne[]; client: Client };
type FactureDoc = Facture & { lignes: FactureLigne[]; client: Client };

function baseStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
    .brand { font-size: 24px; font-weight: 700; color: #2563eb; }
    .meta { text-align: right; font-size: 14px; color: #666; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
    .party h3 { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #64748b; }
    .totals { margin-left: auto; width: 280px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .ttc { font-weight: 700; font-size: 18px; border-top: 2px solid #2563eb; padding-top: 12px; margin-top: 8px; }
    footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #888; line-height: 1.6; }
    .hash { font-family: monospace; font-size: 10px; word-break: break-all; margin-top: 8px; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
  `;
}

function companyBlock(company: Company | null) {
  if (!company) return "<p>Entreprise non configurée</p>";
  return `
    <strong>${company.raisonSociale}</strong><br>
    ${company.adresse}<br>
    ${company.codePostal} ${company.ville}<br>
    SIRET : ${company.siret}<br>
    ${company.tvaIntracom ? `TVA : ${company.tvaIntracom}<br>` : ""}
    ${company.telephone ? `Tél : ${company.telephone}` : ""}
  `;
}

function clientBlock(client: Client) {
  return `
    <strong>${client.nom}</strong><br>
    ${client.adresse ? `${client.adresse}<br>` : ""}
    ${client.telephone ? `Tél : ${client.telephone}<br>` : ""}
    ${client.email ?? ""}
  `;
}

function linesTable(lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number }[]) {
  const rows = lignes
    .map(
      (l) => `
    <tr>
      <td>${l.description}</td>
      <td>${l.quantite}</td>
      <td>${formatEuro(l.prixUnitaireHT)}</td>
      <td>${formatEuro(l.totalHT)}</td>
    </tr>`
    )
    .join("");

  return `
    <table>
      <thead><tr><th>Description</th><th>Qté</th><th>P.U. HT</th><th>Total HT</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function legalFooter(company: Company | null, contentHash?: string | null) {
  const mentions = company
    ? [
        company.rcs ? `RCS : ${company.rcs}` : null,
        company.capitalSocial ? `Capital : ${company.capitalSocial}` : null,
        company.assurances ? `Assurances : ${company.assurances}` : null,
        "Document inaltérable — conforme loi anti-fraude TVA 2018",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return `
    <footer>
      <p>${mentions}</p>
      ${contentHash ? `<p class="hash">Empreinte d'intégrité : ${contentHash}</p>` : ""}
    </footer>`;
}

export function renderDevisHtml(devis: DevisDoc, company: Company | null): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Devis ${devis.numero} — DevisPropre</title>
  <style>${baseStyles()}</style>
</head>
<body>
  <header>
    <div class="brand">DevisPropre</div>
    <div class="meta">
      <h1>DEVIS</h1>
      <p>N° ${devis.numero}</p>
      <p>Date : ${formatDate(devis.createdAt)}</p>
      ${devis.validUntil ? `<p>Valable jusqu'au ${formatDate(devis.validUntil)}</p>` : ""}
    </div>
  </header>
  <div class="parties">
    <div class="party"><h3>Émetteur</h3>${companyBlock(company)}</div>
    <div class="party"><h3>Client</h3>${clientBlock(devis.client)}</div>
  </div>
  ${linesTable(devis.lignes)}
  <div class="totals">
    <div><span>Total HT</span><span>${formatEuro(devis.totalHT)}</span></div>
    <div><span>TVA</span><span>${formatEuro(devis.totalTVA)}</span></div>
    <div class="ttc"><span>Total TTC</span><span>${formatEuro(devis.totalTTC)}</span></div>
  </div>
  ${devis.notes ? `<p><strong>Notes :</strong> ${devis.notes}</p>` : ""}
  ${devis.contentHash ? `<p class="badge">✓ Document verrouillé — intégrité garantie</p>` : ""}
  ${legalFooter(company, devis.contentHash)}
</body>
</html>`;
}

export function renderFactureHtml(facture: FactureDoc, company: Company | null): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Facture ${facture.numero} — DevisPropre</title>
  <style>${baseStyles()}</style>
</head>
<body>
  <header>
    <div class="brand">DevisPropre</div>
    <div class="meta">
      <h1>FACTURE</h1>
      <p>N° ${facture.numero}</p>
      <p>Date : ${formatDate(facture.issuedAt ?? facture.createdAt)}</p>
      ${facture.dateEcheance ? `<p>Échéance : ${formatDate(facture.dateEcheance)}</p>` : ""}
    </div>
  </header>
  <div class="parties">
    <div class="party"><h3>Émetteur</h3>${companyBlock(company)}</div>
    <div class="party"><h3>Client</h3>${clientBlock(facture.client)}</div>
  </div>
  ${linesTable(facture.lignes)}
  <div class="totals">
    <div><span>Total HT</span><span>${formatEuro(facture.totalHT)}</span></div>
    <div><span>TVA</span><span>${formatEuro(facture.totalTVA)}</span></div>
    <div class="ttc"><span>Total TTC</span><span>${formatEuro(facture.totalTTC)}</span></div>
  </div>
  ${facture.notes ? `<p><strong>Notes :</strong> ${facture.notes}</p>` : ""}
  ${facture.contentHash ? `<p class="badge">✓ Facture verrouillée — conforme loi anti-fraude TVA 2018</p>` : ""}
  ${legalFooter(company, facture.contentHash)}
</body>
</html>`;
}

export function renderAttestationHtml(
  attestation: { numero: string; contentHash: string; signedAt: Date },
  facture: FactureDoc,
  company: Company | null
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Attestation ${attestation.numero}</title>
  <style>${baseStyles()}</style>
</head>
<body>
  <header>
    <div class="brand">DevisPropre</div>
    <div class="meta"><h1>ATTESTATION DE CONFORMITÉ</h1><p>N° ${attestation.numero}</p></div>
  </header>
  <p style="margin: 24px 0; line-height: 1.8;">
    Je soussigné(e), <strong>${company?.raisonSociale ?? "l'artisan"}</strong>,
    atteste que le logiciel DevisPropre garantit l'inaltérabilité, la sécurisation,
    la conservation et l'archivage de la facture n° <strong>${facture.numero}</strong>,
    conformément aux exigences de la loi anti-fraude à la TVA (2018).
  </p>
  <p>Date de signature : ${formatDate(attestation.signedAt)}</p>
  <p class="hash">Empreinte facture : ${attestation.contentHash}</p>
  ${legalFooter(company, attestation.contentHash)}
</body>
</html>`;
}
