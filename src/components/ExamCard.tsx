import { Link } from "react-router-dom";
import { Button } from "./Button";
import { Card } from "./Card";
import { downloadExamFile } from "../lib/examFiles";
import { useToast } from "../context/ToastContext";
import type { Exam } from "../types";

export const ExamCard = ({ exam }: { exam: Exam }) => {
  const { showToast } = useToast();
  const download = async () => {
    if (!exam.filePath || !exam.fileName) return;
    try {
      await downloadExamFile(exam.filePath, exam.fileName);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Le téléchargement a échoué.", "error");
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-brand-900">{exam.title}</h3>
          <p className="mt-2 text-sm text-stone-600">{exam.level} · {exam.semester} · {exam.subject}</p>
          <p className="mt-1 text-sm text-stone-600">{exam.type}{exam.themes?.length ? ` · ${exam.themes.join(", ")}` : ""}</p>
          {exam.fileName && <p className="mt-1 text-sm font-semibold text-brand-800">{exam.fileName}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/dashboard/exams/preview/${exam.id}`}><Button variant="secondary">Détails</Button></Link>
          {exam.filePath && exam.fileName && <Button variant="secondary" onClick={() => void download()}>Télécharger le PDF</Button>}
        </div>
      </div>
    </Card>
  );
};
