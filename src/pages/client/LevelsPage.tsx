import { AppShell } from "../../components/Layout";
import { LevelCard } from "../../components/ChoiceCards";
import { levelGroups } from "../../data/options";
import { useAuth } from "../../context/AuthContext";

const examLevelForClient = (level?: string) => (level === "6ème" ? "CE6" : level);

export const LevelsPage = () => {
  const { user } = useAuth();
  const allowedLevel = examLevelForClient(user?.schoolLevel);
  const visibleGroups = levelGroups
    .map((group) => ({ ...group, levels: group.levels.filter((level) => Boolean(allowedLevel) && level === allowedLevel) }))
    .filter((group) => group.levels.length > 0);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-brand-900">Choisir un niveau</h1>
      <p className="mt-2 text-stone-600">Votre accès est limité à : {user?.schoolLevel || "Non renseigné"}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center text-stone-600">Aucun examen disponible pour votre niveau et votre matière pour le moment.</div>
        ) : visibleGroups.flatMap((group) => group.levels.map((level) => <LevelCard key={level} title={level} group={group.title} to={`/dashboard/semesters/${level}`} />))}
      </div>
    </AppShell>
  );
};
