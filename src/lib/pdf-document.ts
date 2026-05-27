import PDFDocument from "pdfkit";
import type { Company, Client, Devis, DevisLigne, Facture, FactureLigne } from "@/generated/prisma/client";
import { formatDate, formatEuro } from "./format";
import { resolveLogoBuffer } from "./logo-storage";
import { FRANCHISE_MENTION } from "./tva";

type DevisDoc = Devis & { lignes: DevisLigne[]; client: Client };
type FactureDoc = Facture & { lignes: FactureLigne[]; client: Client };

function isFranchiseTva(company: Company | null): boolean {
  return company?.tvaApplicable === false;
}

function pdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function drawHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  numero: string,
  date: Date,
  company: Company | null,
  logoBuffer: Buffer | null
) {
  doc.fontSize(20).fillColor("#1a3a5c").text("DevisPropre", 50, 50);
  doc.fontSize(16).fillColor("#000").text(title, 400, 50, { align: "right" });
  doc.fontSize(10).text(`N° ${numero}`, 400, 72, { align: "right" });
  doc.text(`Date : ${formatDate(date)}`, 400, 86, { align: "right" });

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 50, 80, { width: 80 });
      if (company?.raisonSociale) {
        doc.fontSize(7).fillColor("#64748b").text(`Logo : ${company.raisonSociale}`, 50, 165, { width: 120 });
      }
    } catch {
      /* logo invalide */
    }
  }

  const companyTop = logoBuffer ? 180 : 130;
  if (company) {
    doc.fontSize(10).fillColor("#333");
    doc.text(company.raisonSociale, 50, companyTop);
    doc.text(`${company.adresse}, ${company.codePostal} ${company.ville}`);
    doc.text(`SIRET : ${company.siret}`);
    if (company.tvaIntracom) doc.text(`N° TVA : ${company.tvaIntracom}`);
    if (company.telephone) doc.text(`Tél : ${company.telephone}`);
    if (isFranchiseTva(company)) {
      doc.fontSize(8).fillColor("#444").text(FRANCHISE_MENTION, 50, companyTop + 48);
    }
  }
}

function drawClient(doc: PDFKit.PDFDocument, client: Client, y: number) {
  doc.fontSize(9).fillColor("#888").text("CLIENT", 300, y);
  doc.fontSize(10).fillColor("#000").text(client.nom, 300, y + 14);
  if (client.adresse) doc.text(client.adresse, 300);
  if (client.telephone) doc.text(`Tél : ${client.telephone}`, 300);
  if (client.email) doc.text(client.email, 300);
}

function drawLinesTable(
  doc: PDFKit.PDFDocument,
  lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number; tva: number }[],
  company: Company | null,
  totals: { totalHT: number; totalTVA: number; totalTTC: number }
) {
  const franchise = isFranchiseTva(company);
  let y = franchise ? 230 : 220;

  doc.fontSize(9).fillColor("#64748b");
  doc.text("Description", 50, y);
  doc.text("Qté", 240, y);
  doc.text("P.U. HT", 290, y);
  if (!franchise) doc.text("TVA", 360, y);
  doc.text("Total HT", franchise ? 420 : 440, y);
  y += 16;
  doc.moveTo(50, y).lineTo(550, y).stroke("#e5e7eb");
  y += 8;

  for (const l of lignes) {
    doc.fillColor("#000").fontSize(9);
    doc.text(l.description, 50, y, { width: 180 });
    doc.text(String(l.quantite), 240, y);
    doc.text(formatEuro(l.prixUnitaireHT), 290, y);
    if (!franchise) doc.text(`${l.tva}%`, 360, y);
    doc.text(formatEuro(l.totalHT), franchise ? 420 : 440, y);
    y += 22;
  }

  y += 10;
  doc.text(`Total HT : ${formatEuro(totals.totalHT)}`, 350, y, { align: "right" });

  if (franchise) {
    doc.fontSize(9).fillColor("#333");
    doc.text(FRANCHISE_MENTION, 50, y + 14, { width: 480 });
    doc.fontSize(12).fillColor("#000");
    doc.text(`Net à payer : ${formatEuro(totals.totalTTC)}`, 350, y + 32, { align: "right" });
  } else {
    doc.text(`TVA : ${formatEuro(totals.totalTVA)}`, 350, y + 14, { align: "right" });
    doc.fontSize(12).fillColor("#000");
    doc.text(`Total TTC : ${formatEuro(totals.totalTTC)}`, 350, y + 32, { align: "right" });
  }
}

function drawFooter(doc: PDFKit.PDFDocument, company: Company | null, contentHash?: string | null) {
  doc.fontSize(7).fillColor("#888");
  const y = 740;
  const parts = [
    company?.rcs ? `RCS : ${company.rcs}` : null,
    company?.capitalSocial ? `Capital : ${company.capitalSocial}` : null,
    company?.assurances ? `Assurances : ${company.assurances}` : null,
    isFranchiseTva(company) ? FRANCHISE_MENTION : null,
    "Document PDF inaltérable — conforme loi anti-fraude TVA 2018",
  ].filter(Boolean);

  doc.text(parts.join(" · "), 50, y, { width: 500 });
  if (contentHash) {
    doc.text(`Empreinte SHA-256 : ${contentHash}`, 50, y + 14, { width: 500 });
  }
}

export async function generateDevisPdf(
  devis: DevisDoc,
  company: Company | null
): Promise<Buffer> {
  const logoBuffer = company ? await resolveLogoBuffer(company.userId, company.logoUrl) : null;
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  drawHeader(doc, "DEVIS", devis.numero, devis.createdAt, company, logoBuffer);
  drawClient(doc, devis.client, 130);
  drawLinesTable(doc, devis.lignes, company, {
    totalHT: devis.totalHT,
    totalTVA: devis.totalTVA,
    totalTTC: devis.totalTTC,
  });
  if (devis.notes) {
    doc.fontSize(9).fillColor("#333").text(`Notes : ${devis.notes}`, 50, 660, { width: 500 });
  }
  if (devis.validUntil) {
    doc.text(`Valable jusqu'au ${formatDate(devis.validUntil)}`, 50, 675, { width: 500 });
  }
  drawFooter(doc, company, devis.contentHash);
  return pdfBuffer(doc);
}

export async function generateFacturePdf(
  facture: FactureDoc,
  company: Company | null
): Promise<Buffer> {
  const logoBuffer = company ? await resolveLogoBuffer(company.userId, company.logoUrl) : null;
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  drawHeader(doc, "FACTURE", facture.numero, facture.issuedAt ?? facture.createdAt, company, logoBuffer);
  drawClient(doc, facture.client, 130);
  drawLinesTable(doc, facture.lignes, company, {
    totalHT: facture.totalHT,
    totalTVA: facture.totalTVA,
    totalTTC: facture.totalTTC,
  });
  if (facture.dateEcheance) {
    doc.fontSize(9).text(`Échéance : ${formatDate(facture.dateEcheance)}`, 50, 660);
  }
  if (facture.notes) {
    doc.fontSize(9).fillColor("#333").text(`Notes : ${facture.notes}`, 50, 675, { width: 500 });
  }
  drawFooter(doc, company, facture.contentHash);
  return pdfBuffer(doc);
}

export async function generateAttestationPdf(
  attestation: { numero: string; contentHash: string; signedAt: Date },
  facture: FactureDoc,
  company: Company | null
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.fontSize(18).text("ATTESTATION DE CONFORMITÉ", 50, 50);
  doc.fontSize(10).text(`N° ${attestation.numero}`, 50, 78);
  doc.moveDown(2);
  doc.fontSize(11).text(
    `Je soussigné(e), ${company?.raisonSociale ?? "l'artisan"}, atteste que le logiciel DevisPropre garantit l'inaltérabilité, la sécurisation, la conservation et l'archivage de la facture n° ${facture.numero}, conformément à la loi anti-fraude à la TVA (2018).`,
    { width: 500 }
  );
  doc.moveDown();
  doc.text(`Date : ${formatDate(attestation.signedAt)}`);
  doc.text(`Empreinte facture : ${attestation.contentHash}`);
  drawFooter(doc, company, attestation.contentHash);
  return pdfBuffer(doc);
}
