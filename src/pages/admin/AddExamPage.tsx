import { AppShell } from "../../components/Layout";
import { Card } from "../../components/Card";
import { ExamForm } from "../../components/ExamForm";

export const AddExamPage = () => (
  <AppShell>
    <Card>
      <h1 className="text-2xl font-bold text-brand-900">Ajouter un examen</h1>
      <div className="mt-6"><ExamForm /></div>
    </Card>
  </AppShell>
);
