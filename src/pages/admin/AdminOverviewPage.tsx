import { useEffect, useState } from "react";
import { AppShell } from "../../components/Layout";
import { Card } from "../../components/Card";
import { getDownloadCount, getExams } from "../../lib/storage";
import { supabase } from "../../lib/supabase";
import type { UserStatus } from "../../types";

const emptyCounts: Record<UserStatus, number> = { pending: 0, active: 0, suspended: 0, rejected: 0 };

export const AdminOverviewPage = () => {
  const [accountCounts, setAccountCounts] = useState(emptyCounts);
  const exams = getExams();

  useEffect(() => {
    let mounted = true;
    void supabase.from("profiles").select("account_status").eq("role", "teacher").then(({ data }) => {
      if (!mounted || !data) return;
      const next = { ...emptyCounts };
      data.forEach(({ account_status }) => {
        if (account_status in next) next[account_status as UserStatus] += 1;
      });
      setAccountCounts(next);
    });
    return () => { mounted = false; };
  }, []);

  const totalUsers = Object.values(accountCounts).reduce((total, count) => total + count, 0);
  const stats = [
    ["Total utilisateurs", totalUsers],
    ["Comptes en attente", accountCounts.pending],
    ["Comptes actifs", accountCounts.active],
    ["Comptes suspendus", accountCounts.suspended],
    ["Nombre d'examens", exams.length],
    ["Nombre de PDF téléchargés", getDownloadCount()]
  ];

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-brand-900">Vue d'ensemble admin</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => <Card key={label}><p className="text-sm font-semibold text-stone-600">{label}</p><p className="mt-3 text-4xl font-black text-brand-900">{value}</p></Card>)}
      </div>
    </AppShell>
  );
};
