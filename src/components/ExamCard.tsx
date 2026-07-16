import { Link } from "react-router-dom";
import { Button } from "./Button";
import { Card } from "./Card";
import { generateAiStudentPdf, generateExamPdf } from "../lib/pdf";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Exam } from "../types";

export const ExamCard = ({ exam }: { exam: Exam }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const download = () => {
    if (!user) return;
    if (exam.aiGenerated) {
      generateAiStudentPdf(exam.aiGenerated, user);
    } else {
      generateExamPdf(exam, user);
    }
    showToast("PDF personnalisé généré avec succès.");
  };

  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-brand-900">{exam.title}</h3>
          <p className="mt-2 text-sm text-stone-600">{exam.level} · {exam.semester} · {exam.subject}</p>
          <p className="mt-1 text-sm text-stone-600">{exam.type} · {exam.duration}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/dashboard/exams/preview/${exam.id}`}><Button variant="secondary">Aperçu</Button></Link>
          <Button variant="secondary" onClick={download}>PDF personnalisé</Button>
        </div>
      </div>
    </Card>
  );
};
