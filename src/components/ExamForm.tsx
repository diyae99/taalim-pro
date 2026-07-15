import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiExamGenerator } from "./AiExamGenerator";
import { Button } from "./Button";
import { allLevels, semesters, subjects } from "../data/options";
import { fileToDataUrl, getExams, makeId, saveExams } from "../lib/storage";
import { useToast } from "../context/ToastContext";
import type { Exam, Level, Semester, Subject } from "../types";
import type { GeneratedExamResponse } from "../types/aiExam";

const blankExam: Exam = {
  id: "",
  title: "",
  level: "CP",
  semester: "Premier semestre",
  subject: "Mathématiques",
  type: "",
  duration: "",
  bareme: "",
  content: "",
  correction: "",
  active: true,
  createdAt: ""
};

export const ExamForm = ({ exam }: { exam?: Exam }) => {
  const [form, setForm] = useState<Exam>(exam ?? blankExam);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const update = (field: keyof Exam, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));

  const generatedExamToContent = (generated: GeneratedExamResponse) => {
    const instructions = generated.exam.generalInstructions.map((item) => `- ${item}`).join("\n");
    const sections = generated.exam.sections.map((section) => {
      const questions = section.questions.map((question) => {
        const options = question.options.length ? `\n${question.options.map((option) => `   - ${option}`).join("\n")}` : "";
        return `${question.id}. ${question.statement} (${question.score} pts)${options}`;
      }).join("\n\n");
      return `${section.title}\n${section.instructions}\n\n${questions}`;
    }).join("\n\n");
    return `Consignes générales\n${instructions}\n\n${sections}`;
  };

  const generatedExamToCorrection = (generated: GeneratedExamResponse) =>
    generated.answerKey.map((answer) => `${answer.questionId}. ${answer.expectedAnswer}\nExplication : ${answer.explanation}`).join("\n\n");

  const applyGeneratedExam = (generated: GeneratedExamResponse) => {
    setForm((current) => ({
      ...current,
      title: generated.exam.title,
      duration: `${generated.exam.durationMinutes} min`,
      bareme: `${generated.exam.totalScore} points`,
      content: generatedExamToContent(generated),
      correction: generatedExamToCorrection(generated),
      aiGenerated: generated
    }));
    showToast("Examen IA appliqué au formulaire.");
  };

  const onPdfUpload = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      showToast("Merci de choisir un fichier PDF.", "error");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setForm((current) => ({ ...current, uploadedPdf: { fileName: file.name, dataUrl } }));
    showToast("PDF ajouté à l'examen.");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.type || !form.duration || !form.bareme || (!form.content && !form.uploadedPdf)) {
      showToast("Merci de compléter les champs obligatoires.", "error");
      return;
    }
    const exams = getExams();
    const payload: Exam = exam ? form : { ...form, id: makeId("exam"), createdAt: new Date().toISOString() };
    saveExams(exam ? exams.map((item) => (item.id === exam.id ? payload : item)) : [payload, ...exams]);
    showToast(exam ? "Examen modifié avec succès." : "Examen ajouté avec succès.");
    navigate("/admin/exams");
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <AiExamGenerator examDraft={form} onApply={applyGeneratedExam} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">Titre
          <input className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.title} onChange={(e) => update("title", e.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">Type d'examen
          <input className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.type} onChange={(e) => update("type", e.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">Niveau
          <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.level} onChange={(e) => update("level", e.target.value as Level)}>
            {allLevels.map((level) => <option key={level}>{level}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Semestre
          <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.semester} onChange={(e) => update("semester", e.target.value as Semester)}>
            {semesters.map((semester) => <option key={semester}>{semester}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Matière
          <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.subject} onChange={(e) => update("subject", e.target.value as Subject)}>
            {subjects.map((subject) => <option key={subject}>{subject}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Durée
          <input className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.duration} onChange={(e) => update("duration", e.target.value)} />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold">Barème
        <input className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.bareme} onChange={(e) => update("bareme", e.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">PDF de l'examen
        <input type="file" accept="application/pdf" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" onChange={(e) => onPdfUpload(e.target.files?.[0])} />
        {form.uploadedPdf ? (
          <span className="text-xs font-semibold text-brand-700">Fichier sélectionné : {form.uploadedPdf.fileName}</span>
        ) : (
          <span className="text-xs text-stone-500">Aucun PDF sélectionné.</span>
        )}
      </label>
      <label className="grid gap-2 text-sm font-semibold">Contenu de l'examen optionnel
        <textarea rows={8} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.content} onChange={(e) => update("content", e.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-semibold">Correction optionnelle
        <textarea rows={4} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.correction} onChange={(e) => update("correction", e.target.value)} />
      </label>
      {form.aiGenerated && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          Cet examen contient une structure IA. Les exports PDF élève/correction seront disponibles.
        </div>
      )}
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} />
        Examen actif
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate("/admin/exams")}>Annuler</Button>
        <Button type="submit">{exam ? "Enregistrer" : "Ajouter l'examen"}</Button>
      </div>
    </form>
  );
};
