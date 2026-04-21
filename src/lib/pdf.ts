import { jsPDF } from "jspdf";

export function downloadPdf(title: string, content: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 22 + 10;

  doc.setDrawColor(180, 150, 60);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const paragraphs = content.split(/\n+/);
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) { y += 8; continue; }

    let text = trimmed;
    let isHeading = false;
    if (/^#{1,3}\s/.test(trimmed)) {
      text = trimmed.replace(/^#{1,3}\s/, "");
      isHeading = true;
    } else if (/^\*\*.+\*\*$/.test(trimmed)) {
      text = trimmed.replace(/\*\*/g, "");
      isHeading = true;
    }

    if (isHeading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    }
    text = text.replace(/\*\*/g, "");

    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += isHeading ? 18 : 15;
    }
    y += isHeading ? 6 : 4;
  }

  const safe = title.replace(/[^a-z0-9äöüß-]+/gi, "_").slice(0, 60) || "document";
  doc.save(`${safe}.pdf`);
}
