import { Button } from "./Button";
import type { User, UserStatus } from "../types";

interface UserTableProps {
  users: User[];
  onStatus: (id: string, status: UserStatus) => void;
  onDelete: (id: string) => void;
  onView: (user: User) => void;
  onRegeneratePassword: (id: string) => void;
  onCopyPassword: (password: string) => void;
  generatedPasswords: Record<string, string>;
}

const badge = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800"
};

const label: Record<UserStatus, string> = {
  pending: "En traitement",
  active: "Actif",
  suspended: "Suspendu"
};

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const fallback = (value?: string) => value || "Non renseigné";

export const UserTable = ({ users, onStatus, onDelete, onView, onRegeneratePassword, onCopyPassword, generatedPasswords }: UserTableProps) => {
  if (users.length === 0) {
    return <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center text-stone-600">Aucun client dans cette vue.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-[1240px] w-full text-left text-sm">
          <thead className="bg-brand-50 text-brand-900">
            <tr>
              <th className="px-4 py-3">Nom complet</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Niveau</th>
              <th className="px-4 py-3">Matière</th>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Inscription</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-semibold text-ink">{user.fullName}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.phone}</td>
                <td className="px-4 py-3">{user.schoolName}</td>
                <td className="px-4 py-3">{user.city}</td>
                <td className="px-4 py-3">{fallback(user.schoolLevel)}</td>
                <td className="px-4 py-3">{fallback(user.schoolSubject)}</td>
                <td className="px-4 py-3">{user.logo ? <img src={user.logo} alt="" className="h-10 w-10 rounded-lg object-contain" /> : "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${badge[user.status]}`}>{label[user.status]}</span></td>
                <td className="px-4 py-3">{dateLabel(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => onView(user)}>Voir</Button>
                    {user.status === "pending" && <Button variant="secondary" onClick={() => onStatus(user.id, "active")}>Activer</Button>}
                    {user.status === "active" && <Button variant="secondary" onClick={() => onStatus(user.id, "suspended")}>Suspendre</Button>}
                    {user.status === "suspended" && <Button variant="secondary" onClick={() => onStatus(user.id, "active")}>Réactiver</Button>}
                    <Button variant="secondary" onClick={() => onRegeneratePassword(user.id)}>Regénérer mot de passe</Button>
                    <Button variant="danger" onClick={() => onDelete(user.id)}>Refuser/Supprimer</Button>
                  </div>
                  {generatedPasswords[user.id] && (
                    <div className="mt-3 rounded-xl bg-brand-50 p-3 text-xs text-brand-900">
                      <p className="font-bold">Nouveau mot de passe généré : {generatedPasswords[user.id]}</p>
                      <Button className="mt-2 min-h-8 px-3 py-1 text-xs" variant="secondary" onClick={() => onCopyPassword(generatedPasswords[user.id])}>Copier</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
