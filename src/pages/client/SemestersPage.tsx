import { useParams } from "react-router-dom";
import { AppShell } from "../../components/Layout";
import { SemesterCard } from "../../components/ChoiceCards";
import { semesters } from "../../data/options";

export const SemestersPage = () => {
  const { level } = useParams();
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-brand-900">Semestre · {level}</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {semesters.map((semester) => <SemesterCard key={semester} title={semester} to={`/dashboard/subjects/${level}/${encodeURIComponent(semester)}`} />)}
      </div>
    </AppShell>
  );
};
