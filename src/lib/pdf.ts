import jsPDF from "jspdf";
import { incrementDownloadCount } from "./storage";
import type { Exam, User } from "../types";
import type { GeneratedExamResponse, GeneratedQuestion } from "../types/aiExam";

const splitLines = (doc: jsPDF, text: string, width: number) => doc.splitTextToSize(text, width) as string[];

const addSchoolHeader = (doc: jsPDF, user: User, meta: { title: string; subject: string; level: string; semester?: string; duration: string }) => {
  const margin = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
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
  doc.text(`${meta.subject} · ${meta.level}${meta.semester ? ` · ${meta.semester}` : ""}`, margin + 32, y + 21);

  y += 36;
  doc.setDrawColor(185, 120, 45);
  doc.line(margin, y, pageWidth - margin, y);
  return y + 12;
};

const addWrappedText = (doc: jsPDF, linesText: string, x: number, y: number, width: number) => {
  let cursor = y;
  splitLines(doc, linesText, width).forEach((line) => {
    if (cursor > 276) {
      doc.addPage();
      cursor = 18;
    }
    doc.text(line, x, cursor);
    cursor += 7;
  });
  return cursor;
};

const questionLabel = (question: GeneratedQuestion) => `${question.id}. ${question.statement} (${question.score} pts)`;

export const generateExamPdf = (exam: Exam, user: User) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = addSchoolHeader(doc, user, { title: exam.title, subject: exam.subject, level: exam.level, semester: exam.semester, duration: exam.duration });

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
  y = addWrappedText(doc, exam.content, margin, y, contentWidth);

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

export const generateAiStudentPdf = (generated: GeneratedExamResponse, user: User) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const exam = generated.exam;
  let y = addSchoolHeader(doc, user, {
    title: exam.title,
    subject: exam.subject,
    level: exam.level,
    duration: `${exam.durationMinutes} min`
  });

  if (exam.language === "ar" && "setR2L" in doc) {
    (doc as jsPDF & { setR2L: (value: boolean) => void }).setR2L(true);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(exam.title, margin, y);
  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Durée : ${exam.durationMinutes} min · Barème : ${exam.totalScore} pts`, margin, y);
  y += 10;

  if (exam.generalInstructions.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Consignes", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, exam.generalInstructions.map((item) => `- ${item}`).join("\n"), margin, y, contentWidth);
    y += 4;
  }

  exam.sections.forEach((section) => {
    doc.setFont("helvetica", "bold");
    y = addWrappedText(doc, section.title, margin, y, contentWidth);
    doc.setFont("helvetica", "normal");
    y = addWrappedText(doc, section.instructions, margin, y + 1, contentWidth);
    section.questions.forEach((question) => {
      y = addWrappedText(doc, questionLabel(question), margin, y + 3, contentWidth);
      question.options.forEach((option) => {
        y = addWrappedText(doc, `   - ${option}`, margin, y, contentWidth);
      });
    });
    y += 5;
  });

  incrementDownloadCount();
  doc.save(`${exam.title.replaceAll(" ", "-").toLowerCase()}-eleve.pdf`);
};

export const generateAiCorrectionPdf = (generated: GeneratedExamResponse, user: User) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const exam = generated.exam;
  let y = addSchoolHeader(doc, user, {
    title: `${exam.title} - Correction`,
    subject: exam.subject,
    level: exam.level,
    duration: `${exam.durationMinutes} min`
  });

  if (exam.language === "ar" && "setR2L" in doc) {
    (doc as jsPDF & { setR2L: (value: boolean) => void }).setR2L(true);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`${exam.title} - Correction`, margin, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Barème total : ${exam.totalScore} pts`, margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  generated.answerKey.forEach((answer) => {
    const question = exam.sections.flatMap((section) => section.questions).find((item) => item.id === answer.questionId);
    const score = question ? ` (${question.score} pts)` : "";
    y = addWrappedText(doc, `${answer.questionId}${score} - Réponse attendue : ${answer.expectedAnswer}`, margin, y, contentWidth);
    y = addWrappedText(doc, `Explication : ${answer.explanation}`, margin, y + 1, contentWidth);
    y += 5;
  });

  doc.save(`${exam.title.replaceAll(" ", "-").toLowerCase()}-correction.pdf`);
};
