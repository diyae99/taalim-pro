import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const clientLinks = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/dashboard/levels", label: "Examens" },
  { to: "/dashboard/profile", label: "Profil" }
];

const adminLinks = [
  { to: "/admin", label: "Vue d'ensemble" },
  { to: "/admin/users", label: "Utilisateurs" },
  { to: "/admin/exams", label: "Examens" },
  { to: "/admin/exams/new", label: "Ajouter" }
];

export const Sidebar = () => {
  const { user } = useAuth();
  const links = user?.role === "platform_admin" ? adminLinks : clientLinks;

  return (
    <aside className="rounded-2xl border border-brand-100 bg-white p-3 shadow-soft lg:sticky lg:top-20">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/dashboard" || link.to === "/admin"}
            className={({ isActive }) =>
              `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive ? "bg-brand-600 text-white" : "text-brand-900 hover:bg-brand-50"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};
