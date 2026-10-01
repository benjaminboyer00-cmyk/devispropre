import PDFDocument from "pdfkit";
import type { Company, Client, Devis, DevisLigne, Facture, FactureLigne } from "@/generated/prisma/client";
import {
  DEVIS_LATE_PAYMENT_PENALTY,
  DEVIS_PAYMENT_TERMS,
  DEVIS_RECOVERY_FEE,
  companyIssuerLines,
  devisLegalFooterLines,
  devisRetractationFormLines,
  devisRetractationLines,
  DEVIS_RETRACTATION_TITLE,
  formatAssuranceDecennale,
} from "./devis-legal";
import type { SignatureEvidence } from "./signature-evidence";
import { formatDate, formatEuro } from "./format";
import { resolveLogoBuffer } from "./logo-storage";
import { FRANCHISE_MENTION } from "./tva";

type DevisDoc = Devis & { lignes: DevisLigne[]; client: Client };
type FactureDoc = Facture & { lignes: FactureLigne[]; client: Client };

/** Données de signature électronique à apposer sur le PDF signé. */
export interface DevisPdfSignature {
  evidence: SignatureEvidence;
  evidenceHash: string;
  signatureData: string;
}

function formatDateTimeParis(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) + " (heure de Paris)";
}

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

function drawBonPourAccord(doc: PDFKit.PDFDocument, y: number, signature?: DevisPdfSignature): number {
  const boxX = 300;
  const boxW = 250;
  const boxH = 110;
  doc.rect(boxX, y, boxW, boxH).stroke("#d1d5db");
  doc.fontSize(7).fillColor("#666").text("Date :", boxX + 10, y + 10);
  if (signature) {
    doc.fillColor("#000").text(formatDateTimeParis(signature.evidence.signedAt), boxX + 38, y + 10, {
      width: boxW - 48,
    });
  } else {
    doc.moveTo(boxX + 38, y + 18).lineTo(boxX + boxW - 10, y + 18).stroke("#9ca3af");
  }
  doc.fillColor("#666").text(
    signature ? `Signature du client : ${signature.evidence.signerName}` : "Signature du client :",
    boxX + 10,
    y + 28,
    { width: boxW - 20 }
  );
  doc.rect(boxX + 10, y + 38, boxW - 20, 36).stroke("#d1d5db");
  if (signature) {
    try {
      const png = Buffer.from(signature.signatureData.slice(signature.signatureData.indexOf(",") + 1), "base64");
      doc.image(png, boxX + 12, y + 39, { fit: [boxW - 24, 34], align: "center", valign: "center" });
    } catch {
      /* image invalide — la preuve reste dans le certificat */
    }
  }
  doc.fontSize(9).fillColor("#333").text(signature?.evidence.acceptanceText ?? "Bon pour accord", boxX + 10, y + 82, {
    width: boxW - 20,
    align: "center",
  });
  if (signature) {
    doc.fontSize(6).fillColor("#666").text("Signé électroniquement — voir certificat en dernière page", boxX + 10, y + 97, {
      width: boxW - 20,
      align: "center",
    });
  } else {
    doc.moveTo(boxX + 70, y + 100).lineTo(boxX + boxW - 70, y + 100).dash(2, { space: 2 }).stroke("#9ca3af");
    doc.undash();
  }
  return y + boxH + 12;
}

/** Page d'information précontractuelle : droit de rétractation + formulaire type. */
function drawRetractationPage(doc: PDFKit.PDFDocument, devis: DevisDoc, company: Company | null) {
  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#1a3a5c").text(DEVIS_RETRACTATION_TITLE, 50, 50, { width: 500 });
  doc.moveDown(0.8);
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  for (const line of devisRetractationLines(company?.raisonSociale)) {
    doc.text(line, { width: 500, align: "justify" });
    doc.moveDown(0.6);
  }

  doc.moveDown(1);
  const formLines = devisRetractationFormLines({
    companyName: company?.raisonSociale,
    companyAddress: company ? `${company.adresse}, ${company.codePostal} ${company.ville}` : null,
    companyEmail: company?.email,
    devisNumero: devis.numero,
  });
  const top = doc.y;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#000").text(formLines[0], 60, top + 10, { width: 480 });
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  for (const line of formLines.slice(1)) {
    doc.moveDown(0.7);
    doc.text(line, 60, doc.y, { width: 480 });
  }
  doc.rect(50, top, 500, doc.y - top + 12).stroke("#9ca3af");
}

/** Certificat de signature électronique — dossier de preuve lisible (C. civ. art. 1366-1367). */
function drawSignatureCertificate(doc: PDFKit.PDFDocument, signature: DevisPdfSignature) {
  const e = signature.evidence;
  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#1a3a5c").text("Certificat de signature électronique", 50, 50);
  doc.font("Helvetica").fontSize(8).fillColor("#666").text(
    "Signature électronique simple au sens du règlement (UE) n° 910/2014 (eIDAS) et des articles 1366 et 1367 du Code civil. " +
      "L'identité du signataire a été vérifiée par un code à usage unique envoyé à son adresse e-mail.",
    50,
    74,
    { width: 500 }
  );

  const rows: [string, string][] = [
    ["Devis", `n° ${e.devisNumero}`],
    ["Signataire", e.signerName],
    [
      "E-mail vérifié",
      `${e.signerEmail} (${e.signerEmailSource === "client_record" ? "renseigné par l'émetteur" : "déclaré par le signataire"})`,
    ],
    ["Code e-mail envoyé le", formatDateTimeParis(e.otpSentAt)],
    ["Code e-mail validé le", formatDateTimeParis(e.otpVerifiedAt)],
    ["Date de signature", formatDateTimeParis(e.signedAt)],
    ["Mention", e.acceptanceText],
    ["Information rétractation", e.retractationInfoAcknowledged ? "Prise de connaissance confirmée" : "Non confirmée"],
    [
      "Exécution anticipée",
      e.earlyExecutionRequested
        ? "Demandée expressément par le client (art. L221-25 C. conso.)"
        : "Non demandée",
    ],
    ["Adresse IP", e.ipAddress ?? "non disponible"],
    ["Navigateur", (e.userAgent ?? "non disponible").slice(0, 160)],
    ["Empreinte du devis (SHA-256)", e.contentHash],
    ["Empreinte de l'image de signature", e.signatureImageSha256],
    ["Empreinte de la preuve (SHA-256)", signature.evidenceHash],
  ];

  let y = 112;
  for (const [label, value] of rows) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#444").text(label, 50, y, { width: 150 });
    doc.font("Helvetica").fontSize(8).fillColor("#000").text(value, 205, y, { width: 345 });
    y = Math.max(doc.y, y + 10) + 6;
  }

  y += 8;
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#444").text("Signature manuscrite apposée", 50, y);
  doc.rect(50, y + 12, 220, 70).stroke("#d1d5db");
  try {
    const png = Buffer.from(signature.signatureData.slice(signature.signatureData.indexOf(",") + 1), "base64");
    doc.image(png, 52, y + 14, { fit: [216, 66], align: "center", valign: "center" });
  } catch {
    /* image invalide */
  }

  doc.font("Helvetica").fontSize(7).fillColor("#888").text(
    "Vérification : l'empreinte de la preuve est le SHA-256 de la sérialisation canonique (clés triées) des données ci-dessus, " +
      "conservées par l'émetteur. L'empreinte du devis permet de vérifier que le contenu signé correspond au devis envoyé " +
      "(cf. spécification HASH-SPEC). Toute modification de ce document invalide ces empreintes.",
    50,
    y + 96,
    { width: 500 }
  );
}function drawLegalMentions(doc: PDFKit.PDFDocument, company: Company | null, y: number): number {
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

export async function generateDevisPdf(
  devis: DevisDoc,
  company: Company | null,
  options?: { signature?: DevisPdfSignature }
): Promise<Buffer> {
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
  y = drawBonPourAccord(doc, y, options?.signature);
  y = drawLegalMentions(doc, company, y);
  drawIntegrityFooter(doc, devis.contentHash, y);
  drawRetractationPage(doc, devis, company);
  if (options?.signature) drawSignatureCertificate(doc, options.signature);

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
