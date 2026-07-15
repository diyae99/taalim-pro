import jsPDF from "jspdf";
import { incrementDownloadCount } from "./storage";
import type { Exam, User } from "../types";

const splitLines = (doc: jsPDF, text: string, width: number) => doc.splitTextToSize(text, width) as string[];

export const generateExamPdf = (exam: Exam, user: User) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  if (user.logo) {
    try {
      doc.addImage(user.logo, "PNG", margin, y, 24, 24);
    } catch {
      try {
        doc.addImage(user.logo, "JPEG", margin, y, 24, 24);
      } catch {
        doc.rect(margin, y, 24, 24);
      }
    }
  } else {
    doc.rect(margin, y, 24, 24);
    doc.setFontSize(8);
    doc.text("Logo", margin + 7, y + 13);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(user.schoolName || "Établissement", margin + 32, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(user.city || "Ville", margin + 32, y + 14);
  doc.text(`${exam.subject} · ${exam.level} · ${exam.semester}`, margin + 32, y + 21);

  y += 36;
  doc.setDrawColor(185, 120, 45);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(exam.title, margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Type : ${exam.type}`, margin, y);
  doc.text(`Durée : ${exam.duration}`, pageWidth - margin - 42, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Contenu de l'examen", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  splitLines(doc, exam.content, contentWidth).forEach((line) => {
    if (y > 276) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, margin, y);
    y += 7;
  });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Barème", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  splitLines(doc, exam.bareme, contentWidth).forEach((line) => {
    doc.text(line, margin, y);
    y += 7;
  });

  incrementDownloadCount();
  doc.save(`${exam.title.replaceAll(" ", "-").toLowerCase()}-${user.schoolName.replaceAll(" ", "-").toLowerCase()}.pdf`);
};
