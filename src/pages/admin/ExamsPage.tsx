import { Link } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "../../components/Layout";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { adminUser } from "../../data/seed";
import { generateAiCorrectionPdf, generateAiStudentPdf } from "../../lib/pdf";
import { getExams, saveExams } from "../../lib/storage";
import { useToast } from "../../context/ToastContext";

export const ExamsPage = () => {
  const [exams, setExams] = useState(getExams());
  const { showToast } = useToast();

  const sync = (next: typeof exams, message: string) => {
    saveExams(next);
    setExams(next);
    showToast(message);
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
              <div>
                <h2 className="text-xl font-bold text-brand-900">{exam.title}</h2>
                <p className="mt-2 text-sm text-stone-600">{exam.level} · {exam.semester} · {exam.subject} · {exam.duration}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${exam.active ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-700"}`}>{exam.active ? "Actif" : "Inactif"}</span>
                  {exam.aiGenerated && <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">Généré par IA</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {exam.aiGenerated && <Button variant="secondary" onClick={() => generateAiStudentPdf(exam.aiGenerated!, adminUser)}>PDF élève IA</Button>}
                {exam.aiGenerated && <Button variant="secondary" onClick={() => generateAiCorrectionPdf(exam.aiGenerated!, adminUser)}>Correction IA</Button>}
                <Link to={`/admin/exams/edit/${exam.id}`}><Button variant="secondary">Modifier</Button></Link>
                <Button variant="secondary" onClick={() => sync(exams.map((item) => item.id === exam.id ? { ...item, active: !item.active } : item), "Statut de l'examen mis à jour.")}>{exam.active ? "Désactiver" : "Activer"}</Button>
                <Button variant="danger" onClick={() => sync(exams.filter((item) => item.id !== exam.id), "Examen supprimé.")}>Supprimer</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
};
