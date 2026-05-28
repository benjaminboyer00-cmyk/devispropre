import PDFDocument from "pdfkit";
import type { Company, Client, Devis, DevisLigne, Facture, FactureLigne } from "@/generated/prisma/client";
import {
  DEVIS_LATE_PAYMENT_PENALTY,
  DEVIS_PAYMENT_TERMS,
  DEVIS_RECOVERY_FEE,
  companyIssuerLines,
  devisLegalFooterLines,
  formatAssuranceDecennale,
} from "./devis-legal";
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
): number {
  doc.fontSize(20).fillColor("#1a3a5c").text("DevisPropre", 50, 50);
  doc.fontSize(16).fillColor("#000").text(title, 400, 50, { align: "right" });
  doc.fontSize(10).text(`N° ${numero}`, 400, 72, { align: "right" });
  doc.text(`Date : ${formatDate(date)}`, 400, 86, { align: "right" });

  let companyTop = 130;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 50, 80, { width: 80 });
      companyTop = 180;
    } catch {
      /* logo invalide */
    }
  }

  if (company) {
    doc.fontSize(10).fillColor("#333");
    let y = companyTop;
    for (const line of companyIssuerLines(company)) {
      doc.text(line, 50, y, { width: 240 });
      y += line === company.raisonSociale ? 14 : 12;
    }
    if (isFranchiseTva(company)) {
      doc.fontSize(8).fillColor("#444").text(FRANCHISE_MENTION, 50, y + 2, { width: 240 });
      y += 16;
    }
    return Math.max(y + 8, 200);
  }

  return companyTop + 40;
}

function drawClient(doc: PDFKit.PDFDocument, client: Client, y: number) {
  doc.fontSize(9).fillColor("#888").text("CLIENT", 300, y);
  doc.fontSize(10).fillColor("#000").text(client.nom, 300, y + 14);
  let cy = y + 28;
  if (client.adresse) {
    doc.text(client.adresse, 300, cy);
    cy += 12;
  }
  if (client.telephone) {
    doc.text(`Tél : ${client.telephone}`, 300, cy);
    cy += 12;
  }
  if (client.email) {
    doc.text(client.email, 300, cy);
  }
}

function drawLinesTable(
  doc: PDFKit.PDFDocument,
  lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number; tva: number }[],
  company: Company | null,
  totals: { totalHT: number; totalTVA: number; totalTTC: number },
  startY: number
): number {
  const franchise = isFranchiseTva(company);
  let y = startY + 10;

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
    y += 52;
  } else {
    doc.text(`TVA : ${formatEuro(totals.totalTVA)}`, 350, y + 14, { align: "right" });
    doc.fontSize(12).fillColor("#000");
    doc.text(`Total TTC : ${formatEuro(totals.totalTTC)}`, 350, y + 32, { align: "right" });
    y += 52;
  }

  return y;
}

function drawAssuranceDecennale(doc: PDFKit.PDFDocument, company: Company | null, y: number): number {
  if (!company?.activiteBtp) return y;
  const text = formatAssuranceDecennale(company);
  if (!text) return y;

  doc.fontSize(8).fillColor("#444");
  doc.text("Assurance décennale (BTP)", 50, y, { width: 500 });
  doc.fontSize(7).fillColor("#555").text(text, 50, y + 12, { width: 500 });
  return y + 36;
}

function drawBonPourAccord(doc: PDFKit.PDFDocument, y: number): number {
  const boxX = 300;
  const boxW = 250;
  const boxH = 110;
  doc.rect(boxX, y, boxW, boxH).stroke("#d1d5db");
  doc.fontSize(7).fillColor("#666").text("Date :", boxX + 10, y + 10);
  doc.moveTo(boxX + 38, y + 18).lineTo(boxX + boxW - 10, y + 18).stroke("#9ca3af");
  doc.text("Signature du client :", boxX + 10, y + 28);
  doc.rect(boxX + 10, y + 38, boxW - 20, 36).stroke("#d1d5db");
  doc.fontSize(9).fillColor("#333").text("Bon pour accord", boxX + 10, y + 82, {
    width: boxW - 20,
    align: "center",
  });
  doc.moveTo(boxX + 70, y + 100).lineTo(boxX + boxW - 70, y + 100).dash(2, { space: 2 }).stroke("#9ca3af");
  doc.undash();
  return y + boxH + 12;
}

function drawLegalMentions(doc: PDFKit.PDFDocument, company: Company | null, y: number): number {
  doc.fontSize(7).fillColor("#888");
  let cy = y;
  for (const line of devisLegalFooterLines(company)) {
    const bold = company && !company.tvaApplicable && line === FRANCHISE_MENTION;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(bold ? "#333" : "#888");
    doc.text(line, 50, cy, { width: 500 });
    cy += bold ? 14 : 12;
  }
  return cy + 8;
}

function drawIntegrityFooter(doc: PDFKit.PDFDocument, contentHash: string | null | undefined, y: number) {
  const footerY = Math.min(Math.max(y, 720), 760);
  doc.fontSize(6).fillColor("#aaa").text("Document PDF inaltérable — conforme loi anti-fraude TVA 2018", 50, footerY, {
    width: 500,
  });
  if (contentHash) {
    doc.text(`Empreinte SHA-256 : ${contentHash}`, 50, footerY + 10, { width: 500 });
  }
}

function drawFactureFooter(doc: PDFKit.PDFDocument, company: Company | null, contentHash?: string | null) {
  doc.fontSize(7).fillColor("#888");
  const y = 740;
  const parts = [
    company?.rcs ? `RCS : ${company.rcs}` : null,
    company?.capitalSocial ? `Capital : ${company.capitalSocial}` : null,
    formatAssuranceDecennale(company),
    company?.assurances && !formatAssuranceDecennale(company)?.includes(company.assurances)
      ? `Assurances : ${company.assurances}`
      : null,
    isFranchiseTva(company) ? FRANCHISE_MENTION : null,
    DEVIS_PAYMENT_TERMS,
    DEVIS_LATE_PAYMENT_PENALTY,
    DEVIS_RECOVERY_FEE,
    "Document PDF inaltérable — conforme loi anti-fraude TVA 2018",
  ].filter(Boolean);

  doc.text(parts.join("\n"), 50, y, { width: 500, lineGap: 2 });
  if (contentHash) {
    doc.text(`Empreinte SHA-256 : ${contentHash}`, 50, y + 60, { width: 500 });
  }
}

export async function generateDevisPdf(devis: DevisDoc, company: Company | null): Promise<Buffer> {
  const logoBuffer = company ? await resolveLogoBuffer(company.userId, company.logoUrl) : null;
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const headerBottom = drawHeader(doc, "DEVIS", devis.numero, devis.createdAt, company, logoBuffer);
  drawClient(doc, devis.client, headerBottom - 20);

  let y = drawLinesTable(doc, devis.lignes, company, {
    totalHT: devis.totalHT,
    totalTVA: devis.totalTVA,
    totalTTC: devis.totalTTC,
  }, headerBottom + 20);

  if (devis.notes) {
    doc.fontSize(9).fillColor("#333").text(`Conditions particulières : ${devis.notes}`, 50, y, { width: 500 });
    y += 28;
  }
  if (devis.validUntil) {
    doc.fontSize(9).text(`Valable jusqu'au ${formatDate(devis.validUntil)}`, 50, y, { width: 500 });
    y += 18;
  }

  y = drawAssuranceDecennale(doc, company, y);
  y = drawBonPourAccord(doc, y);
  y = drawLegalMentions(doc, company, y);
  drawIntegrityFooter(doc, devis.contentHash, y);

  return pdfBuffer(doc);
}

export async function generateFacturePdf(facture: FactureDoc, company: Company | null): Promise<Buffer> {
  const logoBuffer = company ? await resolveLogoBuffer(company.userId, company.logoUrl) : null;
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const headerBottom = drawHeader(doc, "FACTURE", facture.numero, facture.issuedAt ?? facture.createdAt, company, logoBuffer);
  drawClient(doc, facture.client, headerBottom - 20);
  drawLinesTable(
    doc,
    facture.lignes,
    company,
    {
      totalHT: facture.totalHT,
      totalTVA: facture.totalTVA,
      totalTTC: facture.totalTTC,
    },
    headerBottom + 20
  );
  if (facture.dateEcheance) {
    doc.fontSize(9).text(`Échéance : ${formatDate(facture.dateEcheance)}`, 50, 660);
  }
  if (facture.notes) {
    doc.fontSize(9).fillColor("#333").text(`Notes : ${facture.notes}`, 50, 675, { width: 500 });
  }
  drawFactureFooter(doc, company, facture.contentHash);
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
  drawFactureFooter(doc, company, attestation.contentHash);
  return pdfBuffer(doc);
}
