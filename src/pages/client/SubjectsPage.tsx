import { useParams } from "react-router-dom";
import { AppShell } from "../../components/Layout";
import { SubjectCard } from "../../components/ChoiceCards";
import { subjects } from "../../data/options";
import { useAuth } from "../../context/AuthContext";

export const SubjectsPage = () => {
  const { level, semester } = useParams();
  const { user } = useAuth();
  const visibleSubjects = subjects.filter((subject) => Boolean(user?.schoolSubject) && subject === user?.schoolSubject);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-brand-900">Matière · {level} · {semester}</h1>
      <p className="mt-2 text-stone-600">Votre matière : {user?.schoolSubject || "Non renseigné"}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSubjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center text-stone-600">Aucun examen disponible pour votre niveau et votre matière pour le moment.</div>
        ) : visibleSubjects.map((subject) => <SubjectCard key={subject} title={subject} to={`/dashboard/exams/${level}/${encodeURIComponent(semester ?? "")}/${encodeURIComponent(subject)}`} />)}
      </div>
    </AppShell>
  );
};
