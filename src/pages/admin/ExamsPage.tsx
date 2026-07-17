import { Link } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "../../components/Layout";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { deleteExamFile, downloadExamFile, formatFileSize } from "../../lib/examFiles";
import { getExams, saveExams } from "../../lib/storage";
import { useToast } from "../../context/ToastContext";
import type { Exam } from "../../types";

const languageLabels = { fr: "Français", ar: "Arabe", en: "Anglais" } as const;

export const ExamsPage = () => {
  const [exams, setExams] = useState(getExams());
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();

  const updateExams = (next: Exam[], message: string) => {
    saveExams(next);
    setExams(next);
    showToast(message);
  };

  const download = async (exam: Exam) => {
    if (!exam.filePath || !exam.fileName) return;
    try {
      await downloadExamFile(exam.filePath, exam.fileName);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Le téléchargement a échoué.", "error");
    }
  };

  const remove = async (exam: Exam) => {
    if (!window.confirm(`Supprimer définitivement « ${exam.title} » ?`)) return;
    setBusyId(exam.id);
    try {
      if (exam.filePath) await deleteExamFile(exam.filePath);
      updateExams(exams.filter((item) => item.id !== exam.id), "Examen supprimé.");
    } catch {
      showToast("Le PDF n'a pas pu être supprimé. L'examen a été conservé pour éviter des données incohérentes.", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-900">Banque d'examens</h1>
        <Link to="/admin/exams/new"><Button>Ajouter un examen</Button></Link>
      </div>
      <div className="mt-5 grid gap-4">
        {exams.length === 0 ? <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center">Aucun examen.</div> : exams.map((exam) => (
          <Card key={exam.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-brand-900">{exam.title}</h2>
                <p className="mt-2 text-sm text-stone-600">{exam.type} · {exam.level} · {exam.subject} · {exam.semester}{exam.language ? ` · ${languageLabels[exam.language]}` : ""}</p>
                {exam.themes?.length ? <p className="mt-1 text-sm text-stone-600">Thèmes : {exam.themes.join(", ")}</p> : null}
                {exam.instructions && <p className="mt-1 text-sm text-stone-600">Instructions : {exam.instructions}</p>}
                {exam.fileName && <p className="mt-1 break-all text-sm font-semibold text-brand-800">{exam.fileName}{exam.fileSize ? ` · ${formatFileSize(exam.fileSize)}` : ""}</p>}
                <p className="mt-1 text-xs text-stone-500">Ajouté le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(exam.createdAt))}</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${exam.active ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-700"}`}>{exam.active ? "Actif" : "Inactif"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {exam.filePath && exam.fileName && <Button variant="secondary" onClick={() => void download(exam)}>Télécharger le PDF</Button>}
                <Link to={`/admin/exams/edit/${exam.id}`}><Button variant="secondary">Modifier</Button></Link>
                <Button variant="secondary" onClick={() => updateExams(exams.map((item) => item.id === exam.id ? { ...item, active: !item.active } : item), "Statut de l'examen mis à jour.")}>{exam.active ? "Désactiver" : "Activer"}</Button>
                <Button variant="danger" disabled={busyId === exam.id} onClick={() => void remove(exam)}>{busyId === exam.id ? "Suppression…" : "Supprimer"}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
};
