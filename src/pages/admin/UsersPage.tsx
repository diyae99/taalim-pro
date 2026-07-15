import { useState } from "react";
import { AppShell } from "../../components/Layout";
import { UserTable } from "../../components/UserTable";
import { Card } from "../../components/Card";
import { getUsers, saveUsers } from "../../lib/storage";
import { useToast } from "../../context/ToastContext";
import type { User, UserStatus } from "../../types";

type Filter = "all" | UserStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "pending", label: "En traitement" },
  { key: "active", label: "Actifs" },
  { key: "suspended", label: "Suspendus" }
];

const statusLabels: Record<UserStatus, string> = {
  pending: "En traitement",
  active: "Actif",
  suspended: "Suspendu"
};

const temporaryPassword = () => `TP-${Math.floor(100000 + Math.random() * 900000)}`;

export const UsersPage = () => {
  const [users, setUsers] = useState(getUsers().filter((user) => user.role === "client"));
  const [selected, setSelected] = useState<User | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [generatedPasswords, setGeneratedPasswords] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const sync = (nextClients: User[]) => {
    const admins = getUsers().filter((user) => user.role === "admin");
    saveUsers([...admins, ...nextClients]);
    setUsers(nextClients);
  };

  const status = (id: string, nextStatus: UserStatus) => {
    sync(users.map((user) => (user.id === id ? { ...user, status: nextStatus } : user)));
    showToast(`Compte ${statusLabels[nextStatus].toLowerCase()}.`);
  };

  const remove = (id: string) => {
    if (!window.confirm("Supprimer ce client de localStorage ?")) return;
    sync(users.filter((user) => user.id !== id));
    setGeneratedPasswords((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    showToast("Utilisateur supprimé.");
  };

  const regeneratePassword = (id: string) => {
    const password = temporaryPassword();
    sync(users.map((user) => (user.id === id ? { ...user, password } : user)));
    setGeneratedPasswords((current) => ({ ...current, [id]: password }));
    showToast("Nouveau mot de passe généré.");
  };

  const copyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      showToast("Mot de passe copié.");
    } catch {
      showToast("Copie impossible dans ce navigateur.", "error");
    }
  };

  const filteredUsers = filter === "all" ? users : users.filter((user) => user.status === filter);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-brand-900">Gestion des utilisateurs</h1>
      <div className="mt-5 grid gap-5">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              className={`focus-ring rounded-xl px-4 py-2 text-sm font-bold transition ${filter === item.key ? "bg-brand-600 text-white" : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"}`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <UserTable
          users={filteredUsers}
          onStatus={status}
          onDelete={remove}
          onView={setSelected}
          onRegeneratePassword={regeneratePassword}
          onCopyPassword={copyPassword}
          generatedPasswords={generatedPasswords}
        />
        {selected && (
          <Card>
            <h2 className="text-xl font-bold text-brand-900">{selected.fullName}</h2>
            <p className="mt-2 text-stone-600">{selected.email} · {selected.phone}</p>
            <p className="text-stone-600">{selected.schoolName}, {selected.city}</p>
            <p className="mt-2 text-sm text-stone-600">Niveau : {selected.schoolLevel || "Non renseigné"}</p>
            <p className="text-sm text-stone-600">Matière : {selected.schoolSubject || "Non renseigné"}</p>
            <p className="mt-2 text-sm font-semibold text-brand-800">Statut : {statusLabels[selected.status]}</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
};
