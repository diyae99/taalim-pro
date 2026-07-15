import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../../components/Layout";
import { ExamCard } from "../../components/ExamCard";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { getExams } from "../../lib/storage";
import type { Exam } from "../../types";

const examLevelForClient = (level?: string) => (level === "6ème" ? "CE6" : level);

export const ExamListPage = () => {
  const { level, semester, subject } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const allowedLevel = examLevelForClient(user?.schoolLevel);
  const allowedSubject = user?.schoolSubject;
  const requestedMatchesProfile = Boolean(allowedLevel && allowedSubject && level === allowedLevel && subject === allowedSubject);
  const exams = requestedMatchesProfile
    ? getExams().filter((exam) => exam.active && exam.level === level && exam.semester === semester && exam.subject === subject)
    : [];

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, [level, semester, subject]);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-brand-900">Examens disponibles</h1>
      <p className="mt-2 text-stone-600">{level} · {semester} · {subject}</p>
      {loading ? <Loading /> : (
        <div className="mt-5 grid gap-4">
          {exams.length === 0 ? <Empty /> : exams.map((exam: Exam) => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      )}
    </AppShell>
  );
};

const Empty = () => <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center text-stone-600">Aucun examen disponible pour votre niveau et votre matière pour le moment.</div>;
