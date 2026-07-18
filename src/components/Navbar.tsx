import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-brand-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">TP</span>
          <span>Taalim Pro</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-ink md:flex">
          <NavLink to="/" className={({ isActive }) => (isActive ? "text-brand-700" : "hover:text-brand-700")}>Accueil</NavLink>
          {user?.role === "teacher" && <NavLink to="/dashboard" className="hover:text-brand-700">Espace client</NavLink>}
          {user?.role === "platform_admin" && <NavLink to="/admin" className="hover:text-brand-700">Admin</NavLink>}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="secondary" onClick={() => void onLogout()}>Déconnexion</Button>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost">Connexion</Button></Link>
              <Link to="/register" className="hidden sm:inline-flex"><Button>Créer un compte</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
