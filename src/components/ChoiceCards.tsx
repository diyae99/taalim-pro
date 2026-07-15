import { Link } from "react-router-dom";
import { Card } from "./Card";

export const LevelCard = ({ title, to, group }: { title: string; to: string; group: string }) => (
  <Link to={to}>
    <Card className="h-full transition hover:-translate-y-1 hover:border-brand-300">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{group}</p>
      <h3 className="mt-2 text-3xl font-bold text-brand-900">{title}</h3>
    </Card>
  </Link>
);

export const SemesterCard = ({ title, to }: { title: string; to: string }) => (
  <Link to={to}>
    <Card className="transition hover:-translate-y-1 hover:border-brand-300">
      <h3 className="text-xl font-bold text-brand-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">Consulter les matières disponibles</p>
    </Card>
  </Link>
);

export const SubjectCard = ({ title, to }: { title: string; to: string }) => (
  <Link to={to}>
    <Card className="transition hover:-translate-y-1 hover:border-brand-300">
      <h3 className="text-lg font-bold text-brand-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">Voir les examens actifs</p>
    </Card>
  </Link>
);
