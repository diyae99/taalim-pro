import { useRef, useState } from "react";
import type { DragEvent, FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { allLevels, semesters, subjects } from "../data/options";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { createExamFilePath, deleteExamFile, formatFileSize, saveExamFile } from "../lib/examFiles";
import { getExams, makeId, saveExams } from "../lib/storage";
import type { Exam, ExamLanguage, Level, Semester, Subject } from "../types";

const MAX_PDF_SIZE = 20 * 1024 * 1024;
const languages: { value: ExamLanguage; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "ar", label: "Arabe" },
  { value: "en", label: "Anglais" }
];

interface ExamFormState {
  title: string;
  type: string;
  level: Level;
  subject: Subject;
  semester: Semester;
  language: ExamLanguage;
  themes: string;
  instructions: string;
  replaceLegacyHeader: boolean;
  headerHeightRatio: number;
  applyHeaderToAllPages: boolean;
}

type FormErrors = Partial<Record<keyof ExamFormState | "file", string>>;

const initialState = (exam?: Exam): ExamFormState => ({
  title: exam?.title ?? "",
  type: exam?.type ?? "",
  level: exam?.level ?? "CP",
  subject: exam?.subject ?? "Mathématiques",
  semester: exam?.semester ?? "Premier semestre",
  language: exam?.language ?? "fr",
  themes: exam?.themes?.join(", ") ?? "",
  instructions: exam?.instructions ?? "",
  replaceLegacyHeader: exam?.replaceLegacyHeader ?? true,
  headerHeightRatio: exam?.headerHeightRatio ?? 0.13,
  applyHeaderToAllPages: exam?.applyHeaderToAllPages ?? false
});

const validatePdf = (file: File) => {
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    return "Le fichier sélectionné doit être au format PDF.";
  }
  if (file.size > MAX_PDF_SIZE) return "La taille du fichier dépasse la limite autorisée.";
  return "";
};

export const ExamForm = ({ exam }: { exam?: Exam }) => {
  const [form, setForm] = useState<ExamFormState>(() => initialState(exam));
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const update = <Field extends keyof ExamFormState>(field: Field, value: ExamFormState[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const selectFile = (nextFile?: File) => {
    if (!nextFile) return;
    const error = validatePdf(nextFile);
    setErrors((current) => ({ ...current, file: error }));
    setFile(error ? null : nextFile);
    if (fileInput.current) fileInput.current.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!form.title.trim()) nextErrors.title = "Le titre de l'examen est obligatoire.";
    if (!form.type.trim()) nextErrors.type = "Le type d'examen est obligatoire.";
    if (!form.level) nextErrors.level = "Le niveau est obligatoire.";
    if (!form.subject) nextErrors.subject = "La matière est obligatoire.";
    if (!form.semester) nextErrors.semester = "Le semestre est obligatoire.";
    if (!form.language) nextErrors.language = "La langue est obligatoire.";
    if (!form.themes.trim()) nextErrors.themes = "Les thèmes sont obligatoires.";
    if (!exam?.filePath && !file) nextErrors.file = "Veuillez sélectionner un fichier PDF.";
    if (file) nextErrors.file = validatePdf(file) || undefined;
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || !validate()) return;
    setSubmitError("");
    setIsSaving(true);

    const exams = getExams();
    const examId = exam?.id ?? makeId("exam");
    let uploadedPath: string | undefined;
    try {
      if (file) {
        uploadedPath = createExamFilePath(examId, file.name);
        await saveExamFile(uploadedPath, file);
      }
      const payload: Exam = {
        ...exam,
        id: examId,
        title: form.title.trim(),
        type: form.type.trim(),
        level: form.level,
        subject: form.subject,
        semester: form.semester,
        language: form.language,
        themes: form.themes.split(",").map((theme) => theme.trim()).filter(Boolean),
        instructions: form.instructions.trim() || undefined,
        filePath: uploadedPath ?? exam?.filePath,
        fileName: file?.name ?? exam?.fileName,
        fileSize: file?.size ?? exam?.fileSize,
        mimeType: file ? "application/pdf" : exam?.mimeType,
        replaceLegacyHeader: form.replaceLegacyHeader,
        headerHeightRatio: form.headerHeightRatio,
        applyHeaderToAllPages: form.applyHeaderToAllPages,
        createdBy: exam?.createdBy ?? user?.id,
        active: exam?.active ?? true,
        createdAt: exam?.createdAt ?? new Date().toISOString()
      };
      saveExams(exam ? exams.map((item) => item.id === exam.id ? payload : item) : [payload, ...exams]);
      if (uploadedPath && exam?.filePath) {
        try {
          await deleteExamFile(exam.filePath);
        } catch {
          showToast("L'examen a été enregistré, mais l'ancien PDF n'a pas pu être supprimé.", "info");
        }
      }
      showToast(exam ? "L'examen a été modifié avec succès." : "L'examen a été ajouté avec succès.");
      navigate("/admin/exams");
    } catch {
      if (uploadedPath) await deleteExamFile(uploadedPath).catch(() => undefined);
      setSubmitError("Une erreur est survenue pendant l'enregistrement de l'examen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-6">
      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-brand-900">Informations générales</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Titre de l'examen" error={errors.title}><input className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.title} onChange={(event) => update("title", event.target.value)} /></Field>
          <Field label="Type d'examen" error={errors.type}><input className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.type} onChange={(event) => update("type", event.target.value)} /></Field>
          <Field label="Niveau" error={errors.level}><select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.level} onChange={(event) => update("level", event.target.value as Level)}>{allLevels.map((level) => <option key={level}>{level}</option>)}</select></Field>
          <Field label="Matière" error={errors.subject}><select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.subject} onChange={(event) => update("subject", event.target.value as Subject)}>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></Field>
          <Field label="Semestre" error={errors.semester}><select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.semester} onChange={(event) => update("semester", event.target.value as Semester)}>{semesters.map((semester) => <option key={semester}>{semester}</option>)}</select></Field>
          <Field label="Langue" error={errors.language}><select className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.language} onChange={(event) => update("language", event.target.value as ExamLanguage)}>{languages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}</select></Field>
          <div className="md:col-span-2"><Field label="Thèmes" error={errors.themes}><input className="focus-ring h-11 rounded-xl border border-brand-200 px-3" placeholder="Fractions, lecture, conjugaison…" value={form.themes} onChange={(event) => update("themes", event.target.value)} /></Field></div>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-brand-900">Fichier de l'examen</h2>
        {exam?.fileName && !file && <p className="text-sm text-stone-600">PDF actuel : <span className="font-semibold text-ink">{exam.fileName}</span>{exam.fileSize ? ` (${formatFileSize(exam.fileSize)})` : ""}</p>}
        <div
          role="button" tabIndex={0}
          className={`focus-ring grid min-h-40 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-6 text-center transition ${isDragging ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-white hover:bg-brand-50"}`}
          onClick={() => fileInput.current?.click()}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <div>
            <p className="font-semibold text-brand-900">Glissez-déposez le fichier PDF ici ou cliquez pour sélectionner un fichier.</p>
            <p className="mt-2 text-sm text-stone-500">PDF uniquement · 20 Mo maximum</p>
            {file && <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3"><p className="font-semibold text-ink">{file.name}</p><p className="text-sm text-stone-600">{formatFileSize(file.size)}</p></div>}
          </div>
        </div>
        <input ref={fileInput} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={(event) => selectFile(event.target.files?.[0])} />
        {file && <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}>Remplacer le fichier</Button><Button type="button" variant="danger" onClick={() => setFile(null)}>Retirer le fichier</Button></div>}
        {errors.file && <p className="text-sm font-semibold text-red-700">{errors.file}</p>}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-brand-900">Instructions</h2>
        <Field label="Instructions (facultatif)"><textarea rows={4} maxLength={1500} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" placeholder="Ajoutez des informations utiles concernant le contenu de cet examen…" value={form.instructions} onChange={(event) => update("instructions", event.target.value)} /></Field>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold text-brand-900">Remplacement de l'en-tête</h2>
        <label className="flex items-center gap-3 text-sm font-semibold text-ink">
          <input type="checkbox" checked={form.replaceLegacyHeader} onChange={(event) => update("replaceLegacyHeader", event.target.checked)} />
          Remplacer l'ancien en-tête lors du téléchargement
        </label>
        <Field label={`Hauteur de l'ancien en-tête : ${Math.round(form.headerHeightRatio * 100)} %`}>
          <input type="range" min={8} max={20} step={1} disabled={!form.replaceLegacyHeader} value={Math.round(form.headerHeightRatio * 100)} onChange={(event) => update("headerHeightRatio", Number(event.target.value) / 100)} className="accent-brand-600" />
        </Field>
        <label className="flex items-center gap-3 text-sm font-semibold text-ink">
          <input type="checkbox" disabled={!form.replaceLegacyHeader} checked={form.applyHeaderToAllPages} onChange={(event) => update("applyHeaderToAllPages", event.target.checked)} />
          Appliquer l'en-tête à toutes les pages
        </label>
      </section>

      {submitError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{submitError}</div>}
      <section className="flex justify-end gap-2 border-t border-brand-100 pt-4">
        <Button type="button" variant="secondary" disabled={isSaving} onClick={() => navigate("/admin/exams")}>Annuler</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? "Enregistrement…" : "Enregistrer l'examen"}</Button>
      </section>
    </form>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="grid gap-1.5 text-sm font-semibold text-ink"><span>{label}</span>{children}{error && <span className="text-xs font-semibold text-red-700">{error}</span>}</label>
);
