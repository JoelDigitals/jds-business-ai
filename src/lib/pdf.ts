import { jsPDF } from "jspdf";

const GOLD: [number, number, number] = [180, 150, 60];
const DARK: [number, number, number] = [30, 30, 35];
const MUTED: [number, number, number] = [120, 120, 130];

function shortId(id: string) {
  return id.replace(/-/g, "").slice(0, 12).toUpperCase();
}

function newDocId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface PdfOptions {
  documentId?: string;
  toolType?: string;
  legal?: boolean;
}

export function downloadPdf(title: string, content: string, options: PdfOptions = {}): string {
  const docId = options.documentId ?? newDocId();
  const docIdShort = shortId(docId);
  const generatedAt = new Date();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;

  // ---- HEADER (title block) ----
  let y = margin;
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 90, pageWidth, 3, "F");

  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("JDS BUSINESS AI", margin, 38);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  const headerTitle = doc.splitTextToSize(title, maxWidth);
  doc.text(headerTitle[0] ?? title, margin, 64);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 210);
  const metaRight = `Doc-ID: ${docIdShort}`;
  doc.text(metaRight, pageWidth - margin, 38, { align: "right" });
  doc.text(generatedAt.toLocaleString(), pageWidth - margin, 52, { align: "right" });
  if (options.toolType) {
    doc.text(options.toolType.toUpperCase(), pageWidth - margin, 66, { align: "right" });
  }

  y = 130;

  // ---- LEGAL DISCLAIMER BANNER ----
  if (options.legal) {
    doc.setFillColor(250, 243, 220);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    const bannerHeight = 56;
    doc.roundedRect(margin, y, maxWidth, bannerHeight, 6, 6, "FD");
    doc.setTextColor(120, 90, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Wichtiger rechtlicher Hinweis", margin + 14, y + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const dis = doc.splitTextToSize(
      "Dieses Dokument ist eine KI-gestützte Vorlage und ersetzt keine individuelle Rechtsberatung. Bitte vor Verwendung durch eine qualifizierte Fachperson prüfen lassen.",
      maxWidth - 28
    );
    doc.text(dis, margin + 14, y + 34);
    y += bannerHeight + 18;
  }

  // ---- BODY ----
  doc.setTextColor(20, 20, 25);

  const ensureSpace = (need: number) => {
    if (y + need > pageHeight - margin - 30) {
      addFooter();
      doc.addPage();
      y = margin;
    }
  };

  const writeHeading = (text: string, level: number) => {
    const size = level === 1 ? 16 : level === 2 ? 13 : 11.5;
    const before = level === 1 ? 14 : 10;
    const after = level === 1 ? 8 : 6;
    ensureSpace(size + before + after + 4);
    y += before;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 2;
    }
    if (level === 1) {
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.6);
      doc.line(margin, y + 2, margin + 60, y + 2);
      y += 4;
    }
    y += after;
    doc.setTextColor(20, 20, 25);
  };

  const writeParagraph = (text: string, bullet = false) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const indent = bullet ? 16 : 0;
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(15);
      if (bullet && i === 0) {
        doc.setTextColor(...GOLD);
        doc.text("•", margin, y);
        doc.setTextColor(20, 20, 25);
      }
      doc.text(lines[i], margin + indent, y);
      y += 14;
    }
    y += 4;
  };

  const stripBold = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`/g, "");

  const blocks = content.split(/\n+/);
  for (const raw of blocks) {
    const line = raw.trim();
    if (!line) { y += 4; continue; }

    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    const bold = line.match(/^\*\*(.+)\*\*:?$/);
    const bullet = line.match(/^[-*•]\s+(.*)/);
    const num = line.match(/^\d+\.\s+(.*)/);

    if (h1) writeHeading(stripBold(h1[1]), 1);
    else if (h2) writeHeading(stripBold(h2[1]), 2);
    else if (h3) writeHeading(stripBold(h3[1]), 3);
    else if (bold) writeHeading(stripBold(bold[1]), 3);
    else if (bullet) writeParagraph(stripBold(bullet[1]), true);
    else if (num) writeParagraph(stripBold(line), true);
    else writeParagraph(stripBold(line));
  }

  // ---- FOOTER on every page ----
  function addFooter() {
    const yF = pageHeight - 30;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(margin, yF - 8, pageWidth - margin, yF - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`JDS Business AI · Doc-ID ${docIdShort}`, margin, yF);
    const page = doc.getCurrentPageInfo().pageNumber;
    const total = doc.getNumberOfPages();
    doc.text(`Seite ${page} / ${total}`, pageWidth - margin, yF, { align: "right" });
  }

  // Footer for last page + retro-fit page numbers
  addFooter();
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    // Re-stamp page number with correct total
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth - margin - 80, pageHeight - 38, 80, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Seite ${p} / ${total}`, pageWidth - margin, pageHeight - 30, { align: "right" });
  }

  const safe = title.replace(/[^a-z0-9äöüß-]+/gi, "_").slice(0, 60) || "document";
  doc.save(`${safe}_${docIdShort}.pdf`);
  return docId;
}
