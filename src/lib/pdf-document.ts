import PDFDocument from "pdfkit";
import type { Company, Client, Devis, DevisLigne, Facture, FactureLigne } from "@/generated/prisma/client";
import { formatDate, formatEuro } from "./format";

type DevisDoc = Devis & { lignes: DevisLigne[]; client: Client };
type FactureDoc = Facture & { lignes: FactureLigne[]; client: Client };

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
  company: Company | null
) {
  doc.fontSize(20).fillColor("#2563eb").text("DevisPropre", 50, 50);
  doc.fontSize(16).fillColor("#000").text(title, 400, 50, { align: "right" });
  doc.fontSize(10).text(`N° ${numero}`, 400, 72, { align: "right" });
  doc.text(`Date : ${formatDate(date)}`, 400, 86, { align: "right" });

  if (company?.logoUrl?.startsWith("data:image")) {
    try {
      const base64 = company.logoUrl.split(",")[1];
      if (base64) doc.image(Buffer.from(base64, "base64"), 50, 80, { width: 80 });
    } catch {
      /* logo invalide — ignoré */
    }
  }

  doc.moveDown(2);
  if (company) {
    doc.fontSize(10).fillColor("#333");
    doc.text(company.raisonSociale, 50, 130);
    doc.text(`${company.adresse}, ${company.codePostal} ${company.ville}`);
    doc.text(`SIRET : ${company.siret}`);
    if (company.telephone) doc.text(`Tél : ${company.telephone}`);
  }
}

function drawClient(doc: PDFKit.PDFDocument, client: Client, y: number) {
  doc.fontSize(9).fillColor("#888").text("CLIENT", 300, y);
  doc.fontSize(10).fillColor("#000").text(client.nom, 300, y + 14);
  if (client.adresse) doc.text(client.adresse);
  if (client.telephone) doc.text(`Tél : ${client.telephone}`);
}

function drawLinesTable(
  doc: PDFKit.PDFDocument,
  lignes: { description: string; quantite: number; prixUnitaireHT: number; totalHT: number; tva: number }[],
  company: Company | null,
  totals: { totalHT: number; totalTVA: number; totalTTC: number }
) {
  let y = 220;
  doc.fontSize(9).fillColor("#64748b");
  doc.text("Description", 50, y);
  doc.text("Qté", 280, y);
  doc.text("P.U. HT", 330, y);
  doc.text("Total HT", 420, y);
  y += 16;
  doc.moveTo(50, y).lineTo(550, y).stroke("#e5e7eb");
  y += 8;

  for (const l of lignes) {
    doc.fillColor("#000").fontSize(9);
    doc.text(l.description, 50, y, { width: 220 });
    doc.text(String(l.quantite), 280, y);
    doc.text(formatEuro(l.prixUnitaireHT), 330, y);
    doc.text(formatEuro(l.totalHT), 420, y);
    y += 22;
  }

  y += 10;
  doc.text(`Total HT : ${formatEuro(totals.totalHT)}`, 350, y, { align: "right" });

  if (company?.tvaApplicable !== false) {
    doc.text(`TVA : ${formatEuro(totals.totalTVA)}`, 350, y + 14, { align: "right" });
  } else {
    doc.fontSize(8).fillColor("#666");
    doc.text("TVA non applicable, art. 293 B du CGI", 50, y + 14);
  }

  doc.fontSize(12).fillColor("#000");
  doc.text(`Total TTC : ${formatEuro(totals.totalTTC)}`, 350, y + 32, { align: "right" });
}

function drawFooter(doc: PDFKit.PDFDocument, company: Company | null, contentHash?: string | null) {
  doc.fontSize(7).fillColor("#888");
  const y = 750;
  const mentions = [
    company?.rcs ? `RCS : ${company.rcs}` : null,
    "Document inaltérable — conforme loi anti-fraude TVA 2018",
  ]
    .filter(Boolean)
    .join(" · ");
  doc.text(mentions, 50, y, { width: 500 });
  if (contentHash) {
    doc.text(`Empreinte : ${contentHash.slice(0, 48)}…`, 50, y + 12, { width: 500 });
  }
}

export async function generateDevisPdf(
  devis: DevisDoc,
  company: Company | null
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  drawHeader(doc, "DEVIS", devis.numero, devis.createdAt, company);
  drawClient(doc, devis.client, 130);
  drawLinesTable(doc, devis.lignes, company, {
    totalHT: devis.totalHT,
    totalTVA: devis.totalTVA,
    totalTTC: devis.totalTTC,
  });
  if (devis.notes) {
    doc.fontSize(9).fillColor("#333").text(`Notes : ${devis.notes}`, 50, 680, { width: 500 });
  }
  drawFooter(doc, company, devis.contentHash);
  return pdfBuffer(doc);
}

export async function generateFacturePdf(
  facture: FactureDoc,
  company: Company | null
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  drawHeader(doc, "FACTURE", facture.numero, facture.issuedAt ?? facture.createdAt, company);
  drawClient(doc, facture.client, 130);
  drawLinesTable(doc, facture.lignes, company, {
    totalHT: facture.totalHT,
    totalTVA: facture.totalTVA,
    totalTTC: facture.totalTTC,
  });
  drawFooter(doc, company, facture.contentHash);
  return pdfBuffer(doc);
}
