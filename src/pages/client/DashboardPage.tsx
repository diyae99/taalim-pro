import { Link } from "react-router-dom";
import { AppShell } from "../../components/Layout";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";

export const DashboardPage = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AppShell>
      <div className="grid gap-5">
        <Card className="bg-brand-50">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Bienvenue</p>
              <h1 className="mt-2 text-3xl font-bold text-brand-900">{user.fullName}</h1>
              <p className="mt-2 text-stone-700">{user.schoolName} · {user.city}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="rounded-full bg-white px-3 py-1 text-brand-800">Niveau : {user.schoolLevel || "Non renseigné"}</span>
                <span className="rounded-full bg-white px-3 py-1 text-brand-800">Matière : {user.schoolSubject || "Non renseigné"}</span>
              </div>
              {user.status === "pending" && <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">Votre compte est en attente d'activation admin.</p>}
            </div>
            {user.logo && <img src={user.logo} alt="Logo établissement" className="h-24 w-24 rounded-2xl bg-white object-contain p-2" />}
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><h2 className="text-lg font-bold">Examens prêts</h2><p className="mt-2 text-sm text-stone-600">Les examens sont filtrés selon votre niveau et votre matière.</p></Card>
          <Card><h2 className="text-lg font-bold">PDF personnalisé</h2><p className="mt-2 text-sm text-stone-600">Votre logo est ajouté seulement au téléchargement.</p></Card>
          <Card><h2 className="text-lg font-bold">Profil école</h2><p className="mt-2 text-sm text-stone-600">Gardez vos informations à jour.</p></Card>
        </div>
        <div><Link to="/dashboard/levels"><Button>Choisir un niveau</Button></Link></div>
      </div>
    </AppShell>
  );
};
