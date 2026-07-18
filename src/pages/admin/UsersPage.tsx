import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../components/Layout";
import { Card } from "../../components/Card";
import { Loading } from "../../components/Loading";
import { UserTable } from "../../components/UserTable";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import type { User, UserStatus } from "../../types";

type Filter = "all" | UserStatus;

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  school_name: string | null;
  school_level: string | null;
  school_subject: string | null;
  role: "teacher";
  account_status: UserStatus;
  created_at: string;
}

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "pending", label: "En attente" },
  { key: "active", label: "Actifs" },
  { key: "suspended", label: "Suspendus" },
  { key: "rejected", label: "Rejetés" }
];

const statusLabels: Record<UserStatus, string> = { pending: "en attente", active: "actif", suspended: "suspendu", rejected: "rejeté" };

const toUser = (profile: ProfileRow): User => ({
  id: profile.id,
  fullName: profile.full_name,
  email: profile.email,
  phone: profile.phone ?? "",
  city: profile.city ?? "",
  schoolName: profile.school_name ?? "",
  schoolLevel: profile.school_level ?? undefined,
  schoolSubject: profile.school_subject ?? undefined,
  role: "teacher",
  status: profile.account_status,
  createdAt: profile.created_at
});

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setLoadError("");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, city, school_name, school_level, school_subject, role, account_status, created_at")
      .eq("role", "teacher")
      .order("created_at", { ascending: false });
    if (error) {
      setLoadError("Impossible de charger les inscriptions pour le moment.");
      setUsers([]);
    } else {
      setUsers((data ?? []).map((profile) => toUser(profile as ProfileRow)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const updateStatus = async (user: User, accountStatus: UserStatus) => {
    if (busyUserId) return;
    setBusyUserId(user.id);
    const { data, error } = await supabase
      .from("profiles")
      .update({ account_status: accountStatus })
      .eq("id", user.id)
      .eq("role", "teacher")
      .select("id, account_status")
      .single();
    if (error || !data) {
      showToast("La mise à jour du statut a échoué. Veuillez réessayer.", "error");
    } else {
      await loadUsers(false);
      setSelected((current) => current?.id === user.id ? { ...current, status: accountStatus } : current);
      showToast(`Le compte est maintenant ${statusLabels[accountStatus]}.`);
    }
    setBusyUserId(null);
  };

  const resetPassword = async (user: User) => {
    if (busyUserId) return;
    setBusyUserId(user.id);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/update-password` });
      if (error) {
        showToast("Impossible d'envoyer l'e-mail de réinitialisation.", "error");
      } else {
        showToast("L'e-mail de réinitialisation du mot de passe a été envoyé.");
      }
    } catch {
      showToast("Impossible de contacter le service d'authentification.", "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredUsers = filter === "all" ? users : users.filter((user) => user.status === filter);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-brand-900">Gestion des utilisateurs</h1>
      <div className="mt-5 grid gap-5">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => <button key={item.key} className={`focus-ring rounded-xl px-4 py-2 text-sm font-bold transition ${filter === item.key ? "bg-brand-600 text-white" : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"}`} onClick={() => setFilter(item.key)}>{item.label}</button>)}
        </div>
        {loading ? <Loading /> : loadError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center font-semibold text-red-800">{loadError}</div> : <UserTable users={filteredUsers} busyUserId={busyUserId} onStatus={(user, status) => void updateStatus(user, status)} onPasswordReset={(user) => void resetPassword(user)} onView={setSelected} />}
        {selected && <Card><h2 className="text-xl font-bold text-brand-900">{selected.fullName || "Nom non renseigné"}</h2><p className="mt-2 text-stone-600">{selected.email} · {selected.phone || "Téléphone non renseigné"}</p><p className="text-stone-600">{selected.schoolName || "Établissement non renseigné"}, {selected.city || "Ville non renseignée"}</p><p className="mt-2 text-sm text-stone-600">Niveau : {selected.schoolLevel || "Non renseigné"}</p><p className="text-sm text-stone-600">Matière : {selected.schoolSubject || "Non renseigné"}</p></Card>}
      </div>
    </AppShell>
  );
};
