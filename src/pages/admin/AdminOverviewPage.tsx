import { AppShell } from "../../components/Layout";
import { Card } from "../../components/Card";
import { getDownloadCount, getExams, getUsers } from "../../lib/storage";

export const AdminOverviewPage = () => {
  const users = getUsers().filter((user) => user.role === "client");
  const exams = getExams();
  const stats = [
    ["Total utilisateurs", users.length],
    ["Comptes en attente", users.filter((user) => user.status === "pending").length],
    ["Comptes actifs", users.filter((user) => user.status === "active").length],
    ["Comptes suspendus", users.filter((user) => user.status === "suspended").length],
    ["Nombre d'examens", exams.length],
    ["Nombre de PDF téléchargés", getDownloadCount()]
  ];

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-brand-900">Vue d'ensemble admin</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm font-semibold text-stone-600">{label}</p>
            <p className="mt-3 text-4xl font-black text-brand-900">{value}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
};
