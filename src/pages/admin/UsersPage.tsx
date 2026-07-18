import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../components/Layout";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
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

interface AdminFunctionResponse {
  success?: boolean;
  temporaryPassword?: string;
  error?: string;
  warning?: string;
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
  const [temporaryPassword, setTemporaryPassword] = useState<{ userName: string; value: string } | null>(null);
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
    const activatingNewAccount = accountStatus === "active" && (user.status === "pending" || user.status === "rejected");
    const { error } = activatingNewAccount
      ? await supabase.functions.invoke<AdminFunctionResponse>("admin-manage-user", { body: { action: "activate_user", userId: user.id } })
      : await supabase.rpc("update_teacher_account_status", {
          p_profile_id: user.id,
          p_account_status: accountStatus
        });
    if (error) {
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
      const { data, error } = await supabase.functions.invoke<AdminFunctionResponse>("admin-manage-user", {
        body: { action: "generate_temporary_password", userId: user.id }
      });
      if (error || !data?.success || !data.temporaryPassword) {
        showToast(data?.error ?? "Impossible de générer le mot de passe temporaire.", "error");
        return;
      }
      setTemporaryPassword({ userName: user.fullName || user.email, value: data.temporaryPassword });
      showToast(data.warning ?? "Le mot de passe temporaire a été généré.", data.warning ? "info" : "success");
    } catch {
      showToast("Impossible de contacter le service d'authentification.", "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword.value);
      showToast("Mot de passe temporaire copié.");
    } catch {
      showToast("La copie automatique n’est pas disponible dans ce navigateur.", "error");
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
      {temporaryPassword && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="temporary-password-title">
          <Card className="w-full max-w-lg">
            <h2 id="temporary-password-title" className="text-xl font-bold text-brand-900">Nouveau mot de passe temporaire</h2>
            <p className="mt-2 text-sm text-stone-600">Compte : {temporaryPassword.userName}</p>
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4 font-mono text-lg font-bold tracking-wide text-brand-900 break-all">{temporaryPassword.value}</div>
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Copiez ce mot de passe maintenant. Il ne sera plus affiché après la fermeture de cette fenêtre.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => void copyTemporaryPassword()}>Copier</Button>
              <Button onClick={() => setTemporaryPassword(null)}>Fermer</Button>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
};
