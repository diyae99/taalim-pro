import { Button } from "./Button";
import type { User, UserStatus } from "../types";

interface UserTableProps {
  users: User[];
  busyUserId: string | null;
  onStatus: (user: User, status: UserStatus) => void;
  onPasswordReset: (user: User) => void;
  onView: (user: User) => void;
}

const badge: Record<UserStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  rejected: "bg-stone-200 text-stone-800"
};

const label: Record<UserStatus, string> = {
  pending: "En attente",
  active: "Actif",
  suspended: "Suspendu",
  rejected: "Rejeté"
};

const dateLabel = (value: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const fallback = (value?: string) => value || "Non renseigné";

export const UserTable = ({ users, busyUserId, onStatus, onPasswordReset, onView }: UserTableProps) => {
  if (users.length === 0) return <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center text-stone-600">Aucun enseignant dans cette vue.</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1380px] text-left text-sm">
          <thead className="bg-brand-50 text-brand-900">
            <tr>
              <th className="px-4 py-3">Nom complet</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Établissement</th>
              <th className="px-4 py-3">Niveau</th>
              <th className="px-4 py-3">Matière</th>
              <th className="px-4 py-3">Date d'inscription</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {users.map((user) => {
              const busy = busyUserId === user.id;
              return (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-semibold text-ink">{fallback(user.fullName)}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{fallback(user.phone)}</td>
                  <td className="px-4 py-3">{fallback(user.city)}</td>
                  <td className="px-4 py-3">{fallback(user.schoolName)}</td>
                  <td className="px-4 py-3">{fallback(user.schoolLevel)}</td>
                  <td className="px-4 py-3">{fallback(user.schoolSubject)}</td>
                  <td className="px-4 py-3">{dateLabel(user.createdAt)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${badge[user.status]}`}>{label[user.status]}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" disabled={busy} onClick={() => onView(user)}>Voir</Button>
                      {user.status === "pending" && <><Button disabled={busy} onClick={() => onStatus(user, "active")}>Approuver</Button><Button variant="danger" disabled={busy} onClick={() => onStatus(user, "rejected")}>Rejeter</Button></>}
                      {user.status === "active" && <Button variant="danger" disabled={busy} onClick={() => onStatus(user, "suspended")}>Suspendre</Button>}
                      {user.status === "suspended" && <Button disabled={busy} onClick={() => onStatus(user, "active")}>Réactiver</Button>}
                      {user.status === "rejected" && <Button disabled={busy} onClick={() => onStatus(user, "active")}>Réexaminer et approuver</Button>}
                      <Button variant="secondary" disabled={busy} onClick={() => onPasswordReset(user)}>Réinitialiser le mot de passe</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
