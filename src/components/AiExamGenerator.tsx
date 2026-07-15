import { useMemo, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { generateExamWithAi } from "../lib/examAi";
import { generateAiCorrectionPdf, generateAiStudentPdf } from "../lib/pdf";
import { adminUser } from "../data/seed";
import type { Exam, Level, Subject } from "../types";
import type { ExamDifficulty, ExamLanguage, GenerateExamRequest, GeneratedExamResponse, GeneratedQuestionType } from "../types/aiExam";

interface AiExamGeneratorProps {
  examDraft: Exam;
  onApply: (generated: GeneratedExamResponse) => void;
}

const languages: { value: ExamLanguage; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "ar", label: "Arabe" },
  { value: "en", label: "Anglais" }
];

const difficulties: ExamDifficulty[] = ["facile", "moyen", "difficile"];
const questionTypes: { value: GeneratedQuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Choix multiple" },
  { value: "true_false", label: "Vrai/Faux" },
  { value: "short_answer", label: "Réponse courte" },
  { value: "long_answer", label: "Réponse longue" },
  { value: "exercise", label: "Exercice" },
  { value: "fill_blank", label: "Texte à trous" },
  { value: "matching", label: "Association" }
];

const durationToMinutes = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 60;
};

const examToText = (generated: GeneratedExamResponse) => {
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

const correctionToText = (generated: GeneratedExamResponse) =>
  generated.answerKey.map((answer) => `${answer.questionId}. ${answer.expectedAnswer}\nExplication : ${answer.explanation}`).join("\n\n");

export const AiExamGenerator = ({ examDraft, onApply }: AiExamGeneratorProps) => {
  const [language, setLanguage] = useState<ExamLanguage>("fr");
  const [difficulty, setDifficulty] = useState<ExamDifficulty>("moyen");
  const [numberOfQuestions, setNumberOfQuestions] = useState(6);
  const [durationMinutes, setDurationMinutes] = useState(durationToMinutes(examDraft.duration));
  const [totalScore, setTotalScore] = useState(20);
  const [topics, setTopics] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<GeneratedQuestionType[]>(["exercise", "short_answer"]);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [generated, setGenerated] = useState<GeneratedExamResponse | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const payload = useMemo<GenerateExamRequest>(() => ({
    subject: examDraft.subject,
    level: examDraft.level,
    language,
    difficulty,
    examType: examDraft.type || "Évaluation",
    numberOfQuestions,
    durationMinutes,
    totalScore,
    topics: topics.split(",").map((item) => item.trim()).filter(Boolean),
    questionTypes: selectedTypes,
    additionalInstructions
  }), [examDraft.subject, examDraft.level, examDraft.type, language, difficulty, numberOfQuestions, durationMinutes, totalScore, topics, selectedTypes, additionalInstructions]);

  const toggleQuestionType = (type: GeneratedQuestionType) => {
    setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type].slice(0, 10));
  };

  const submit = async () => {
    if (!examDraft.subject || !examDraft.level || !examDraft.type) {
      setError("Merci de renseigner la matière, le niveau et le type d'examen.");
      return;
    }
    setIsGenerating(true);
    setError("");
    setGenerated(null);
    try {
      const result = await generateExamWithAi(payload);
      setGenerated(result);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "La génération a échoué.");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGenerated = () => {
    if (!generated) return;
    onApply(generated);
  };

  return (
    <Card className="bg-brand-50 shadow-none">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-900">Génération IA sécurisée</h2>
          <p className="mt-1 text-sm text-stone-600">L'appel passe par /api/generate-exam. Aucune clé API n'est envoyée au navigateur.</p>
        </div>
        {generated && <Button variant="secondary" onClick={() => setGenerated(null)}>Modifier les paramètres</Button>}
      </div>

      {!generated ? (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">Langue
              <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={language} onChange={(e) => setLanguage(e.target.value as ExamLanguage)}>
                {languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Difficulté
              <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value as ExamDifficulty)}>
                {difficulties.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Nombre de questions
              <input type="number" min={1} max={20} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={numberOfQuestions} onChange={(e) => setNumberOfQuestions(Number(e.target.value))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Durée en minutes
              <input type="number" min={10} max={240} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Barème total
              <input type="number" min={5} max={100} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={totalScore} onChange={(e) => setTotalScore(Number(e.target.value))} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Thèmes
              <input className="focus-ring rounded-xl border border-brand-200 px-3 py-2" placeholder="fractions, lecture..." value={topics} onChange={(e) => setTopics(e.target.value)} />
            </label>
          </div>
          <div>
            <p className="text-sm font-semibold">Types de questions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {questionTypes.map((type) => (
                <label key={type.value} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${selectedTypes.includes(type.value) ? "border-brand-500 bg-white text-brand-900" : "border-brand-200 bg-brand-50 text-stone-600"}`}>
                  <input className="mr-2" type="checkbox" checked={selectedTypes.includes(type.value)} onChange={() => toggleQuestionType(type.value)} />
                  {type.label}
                </label>
              ))}
            </div>
          </div>
          <label className="grid gap-2 text-sm font-semibold">Instructions supplémentaires
            <textarea rows={4} maxLength={1500} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={additionalInstructions} onChange={(e) => setAdditionalInstructions(e.target.value)} />
          </label>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={isGenerating} onClick={submit}>{isGenerating ? "Génération en cours..." : "Générer avec l'IA"}</Button>
            {error && <Button type="button" variant="secondary" disabled={isGenerating} onClick={submit}>Réessayer</Button>}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">Examen généré avec succès.</div>
          <div className={generated.exam.language === "ar" ? "text-right" : ""} dir={generated.exam.language === "ar" ? "rtl" : "ltr"}>
            <h3 className="text-lg font-bold text-brand-900">{generated.exam.title}</h3>
            <p className="mt-1 text-sm text-stone-600">{generated.exam.subject} · {generated.exam.level} · {generated.exam.durationMinutes} min · {generated.exam.totalScore} pts</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 font-sans text-sm leading-7 text-ink">{examToText(generated)}</pre>
          </div>
          <div className={generated.exam.language === "ar" ? "text-right" : ""} dir={generated.exam.language === "ar" ? "rtl" : "ltr"}>
            <h3 className="text-lg font-bold text-brand-900">Correction</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 font-sans text-sm leading-7 text-ink">{correctionToText(generated)}</pre>
          </div>
          {generated.exam.language === "ar" && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Note : l'aperçu web prend en charge le RTL. L'export PDF utilise jsPDF et peut nécessiter une police arabe dédiée pour un rendu arabe parfait en production.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={applyGenerated}>Utiliser cet examen</Button>
            <Button variant="secondary" onClick={() => generateAiStudentPdf(generated, adminUser)}>Exporter PDF élève</Button>
            <Button variant="secondary" onClick={() => generateAiCorrectionPdf(generated, adminUser)}>Exporter correction</Button>
            <Button variant="secondary" onClick={() => setGenerated(null)}>Retour aux paramètres</Button>
          </div>
        </div>
      )}
    </Card>
  );
};
