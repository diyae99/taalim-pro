import { useParams } from "react-router-dom";
import { AppShell } from "../../components/Layout";
import { Card } from "../../components/Card";
import { ExamForm } from "../../components/ExamForm";
import { getExams } from "../../lib/storage";

export const EditExamPage = () => {
  const { id } = useParams();
  const exam = getExams().find((item) => item.id === id);
  return (
    <AppShell>
      <Card>
        <h1 className="text-2xl font-bold text-brand-900">Modifier un examen</h1>
        <div className="mt-6">{exam ? <ExamForm exam={exam} /> : <p>Examen introuvable.</p>}</div>
      </Card>
    </AppShell>
  );
};
