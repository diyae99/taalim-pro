import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { allLevels, semesters, subjects } from "../data/options";
import { generateExamWithAi } from "../lib/examAi";
import { getExams, makeId, saveExams } from "../lib/storage";
import { useToast } from "../context/ToastContext";
import type { Exam, Level, Semester, Subject } from "../types";
import type { ExamDifficulty, ExamLanguage, GeneratedExamResponse, GeneratedQuestionType } from "../types/aiExam";

const languages: { value: ExamLanguage; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "ar", label: "Arabe" },
  { value: "en", label: "Anglais" }
];

const difficulties: { value: ExamDifficulty; label: string }[] = [
  { value: "facile", label: "Facile" },
  { value: "moyen", label: "Moyen" },
  { value: "difficile", label: "Difficile" }
];

const questionTypes: { value: GeneratedQuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Choix multiple" },
  { value: "true_false", label: "Vrai/Faux" },
  { value: "short_answer", label: "Réponse courte" },
  { value: "long_answer", label: "Réponse longue" },
  { value: "exercise", label: "Exercice" },
  { value: "fill_blank", label: "Texte à trous" },
  { value: "matching", label: "Association" }
];

interface ExamFormState {
  title: string;
  type: string;
  level: Level;
  subject: Subject;
  semester: Semester;
  language: ExamLanguage;
  difficulty: ExamDifficulty;
  numberOfQuestions: number;
  durationMinutes: number;
  totalScore: number;
  topics: string;
  questionTypes: GeneratedQuestionType[];
  additionalInstructions: string;
  active: boolean;
}

type FormErrors = Partial<Record<keyof ExamFormState | "questionTypes", string>>;

const durationToMinutes = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 60;
};

const scoreToNumber = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 20;
};

const initialState = (exam?: Exam): ExamFormState => ({
  title: exam?.title ?? "",
  type: exam?.type ?? "",
  level: exam?.level ?? "CP",
  subject: exam?.subject ?? "Mathématiques",
  semester: exam?.semester ?? "Premier semestre",
  language: exam?.aiGenerated?.exam.language ?? "fr",
  difficulty: "moyen",
  numberOfQuestions: exam?.aiGenerated?.exam.sections.flatMap((section) => section.questions).length ?? 6,
  durationMinutes: exam ? durationToMinutes(exam.duration) : 60,
  totalScore: exam ? scoreToNumber(exam.bareme) : 20,
  topics: "",
  questionTypes: ["exercise", "short_answer"],
  additionalInstructions: "",
  active: exam?.active ?? true
});

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

export const ExamForm = ({ exam }: { exam?: Exam }) => {
  const [form, setForm] = useState<ExamFormState>(() => initialState(exam));
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const update = <Field extends keyof ExamFormState>(field: Field, value: ExamFormState[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const toggleQuestionType = (type: GeneratedQuestionType) => {
    setForm((current) => {
      const nextTypes = current.questionTypes.includes(type)
        ? current.questionTypes.filter((item) => item !== type)
        : [...current.questionTypes, type].slice(0, 10);
      return { ...current, questionTypes: nextTypes };
    });
    setErrors((current) => ({ ...current, questionTypes: "" }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!form.title.trim()) nextErrors.title = "Le titre est obligatoire.";
    if (!form.type.trim()) nextErrors.type = "Le type d'examen est obligatoire.";
    if (!form.level) nextErrors.level = "Le niveau est obligatoire.";
    if (!form.subject) nextErrors.subject = "La matière est obligatoire.";
    if (!form.semester) nextErrors.semester = "Le semestre est obligatoire.";
    if (!form.language) nextErrors.language = "La langue est obligatoire.";
    if (!form.difficulty) nextErrors.difficulty = "La difficulté est obligatoire.";
    if (!Number.isInteger(form.numberOfQuestions) || form.numberOfQuestions < 1 || form.numberOfQuestions > 20) {
      nextErrors.numberOfQuestions = "Choisissez un nombre entre 1 et 20.";
    }
    if (!Number.isInteger(form.durationMinutes) || form.durationMinutes < 10 || form.durationMinutes > 240) {
      nextErrors.durationMinutes = "Choisissez une durée entre 10 et 240 minutes.";
    }
    if (!Number.isInteger(form.totalScore) || form.totalScore < 5 || form.totalScore > 100) {
      nextErrors.totalScore = "Choisissez un barème entre 5 et 100.";
    }
    if (form.questionTypes.length === 0) nextErrors.questionTypes = "Sélectionnez au moins un type de question.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveGeneratedExam = (generated: GeneratedExamResponse) => {
    const exams = getExams();
    const payload: Exam = {
      id: exam?.id ?? makeId("exam"),
      title: form.title.trim(),
      level: form.level,
      semester: form.semester,
      subject: form.subject,
      type: form.type.trim(),
      duration: `${form.durationMinutes} min`,
      bareme: `${form.totalScore} points`,
      content: generatedExamToContent(generated),
      correction: generatedExamToCorrection(generated),
      aiGenerated: {
        ...generated,
        exam: {
          ...generated.exam,
          title: form.title.trim(),
          subject: form.subject,
          level: form.level,
          durationMinutes: form.durationMinutes,
          totalScore: form.totalScore
        }
      },
      active: form.active,
      createdAt: exam?.createdAt ?? new Date().toISOString()
    };
    saveExams(exam ? exams.map((item) => (item.id === exam.id ? payload : item)) : [payload, ...exams]);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setApiError("");
    if (!validate()) return;

    setIsGenerating(true);
    try {
      const generated = await generateExamWithAi({
        title: form.title.trim(),
        subject: form.subject,
        level: form.level,
        semester: form.semester,
        language: form.language,
        difficulty: form.difficulty,
        examType: form.type.trim(),
        numberOfQuestions: form.numberOfQuestions,
        durationMinutes: form.durationMinutes,
        totalScore: form.totalScore,
        topics: form.topics.split(",").map((item) => item.trim()).filter(Boolean),
        questionTypes: form.questionTypes,
        additionalInstructions: form.additionalInstructions.trim()
      });
      saveGeneratedExam(generated);
      showToast(exam ? "Examen régénéré avec succès." : "Examen généré avec succès.");
      navigate("/admin/exams");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "La génération a échoué. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-brand-900">Informations générales</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Titre de l'examen" error={errors.title}>
            <input className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.title} onChange={(event) => update("title", event.target.value)} />
          </Field>
          <Field label="Type d'examen" error={errors.type}>
            <input className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.type} onChange={(event) => update("type", event.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Niveau" error={errors.level}>
            <select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.level} onChange={(event) => update("level", event.target.value as Level)}>
              {allLevels.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </Field>
          <Field label="Matière" error={errors.subject}>
            <select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.subject} onChange={(event) => update("subject", event.target.value as Subject)}>
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Semestre" error={errors.semester}>
            <select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.semester} onChange={(event) => update("semester", event.target.value as Semester)}>
              {semesters.map((semester) => <option key={semester} value={semester}>{semester}</option>)}
            </select>
          </Field>
          <Field label="Langue" error={errors.language}>
            <select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.language} onChange={(event) => update("language", event.target.value as ExamLanguage)}>
              {languages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-brand-900">Paramètres de génération</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Difficulté" error={errors.difficulty}>
            <select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.difficulty} onChange={(event) => update("difficulty", event.target.value as ExamDifficulty)}>
              {difficulties.map((difficulty) => <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>)}
            </select>
          </Field>
          <Field label="Nombre de questions" error={errors.numberOfQuestions}>
            <input type="number" min={1} max={20} className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.numberOfQuestions} onChange={(event) => update("numberOfQuestions", Number(event.target.value))} />
          </Field>
          <Field label="Durée en minutes" error={errors.durationMinutes}>
            <input type="number" min={10} max={240} className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.durationMinutes} onChange={(event) => update("durationMinutes", Number(event.target.value))} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <Field label="Barème total" error={errors.totalScore}>
            <input type="number" min={5} max={100} className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.totalScore} onChange={(event) => update("totalScore", Number(event.target.value))} />
          </Field>
          <Field label="Thèmes">
            <input className="focus-ring h-11 rounded-xl border border-brand-200 px-3" placeholder="fractions, lecture, conjugaison..." value={form.topics} onChange={(event) => update("topics", event.target.value)} />
          </Field>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-brand-900">Types de questions</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {questionTypes.map((type) => (
            <label key={type.value} className={`flex h-11 items-center rounded-xl border px-3 text-sm font-semibold transition ${form.questionTypes.includes(type.value) ? "border-brand-500 bg-brand-50 text-brand-900" : "border-brand-200 bg-white text-stone-600"}`}>
              <input className="mr-2" type="checkbox" checked={form.questionTypes.includes(type.value)} onChange={() => toggleQuestionType(type.value)} />
              {type.label}
            </label>
          ))}
        </div>
        {errors.questionTypes && <p className="text-xs font-semibold text-red-700">{errors.questionTypes}</p>}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-brand-900">Instructions</h2>
        <Field label="Instructions supplémentaires">
          <textarea rows={3} maxLength={1500} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.additionalInstructions} onChange={(event) => update("additionalInstructions", event.target.value)} />
        </Field>
      </section>

      {apiError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{apiError}</div>}

      <section className="flex flex-col gap-4 border-t border-brand-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} />
          Examen actif
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate("/admin/exams")}>Annuler</Button>
          <Button type="submit" disabled={isGenerating}>{isGenerating ? "Génération en cours..." : "Générer avec l'IA"}</Button>
        </div>
      </section>
    </form>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="grid gap-1.5 text-sm font-semibold text-ink">
    <span>{label}</span>
    {children}
    {error && <span className="text-xs font-semibold text-red-700">{error}</span>}
  </label>
);
