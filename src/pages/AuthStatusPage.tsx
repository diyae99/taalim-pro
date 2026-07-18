import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import type { UserStatus } from "../types";

interface AuthStatusPageProps {
  title: string;
  message: string;
  expectedStatus?: UserStatus;
}

const statusPaths: Partial<Record<UserStatus, string>> = { pending: "/account-pending", suspended: "/account-suspended", rejected: "/account-rejected" };

export const AuthStatusPage = ({ title, message, expectedStatus }: AuthStatusPageProps) => {
  const { session, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (expectedStatus && loading) return <><Navbar /><Loading /></>;
  if (expectedStatus && user && user.status !== expectedStatus) {
    const redirect = statusPaths[user.status] ?? (user.role === "platform_admin" ? "/admin" : "/dashboard");
    return <Navigate to={redirect} replace />;
  }

  return <><Navbar /><main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-lg items-center px-4 py-10"><Card className="text-center"><h1 className="text-2xl font-bold text-brand-900">{title}</h1><p className="mt-4 leading-7 text-stone-600">{message}</p>{session ? <Button className="mt-6" variant="secondary" onClick={() => void signOut()}>Se déconnecter</Button> : <Link className="mt-6 inline-block text-sm font-bold text-brand-700" to="/login">Retour à la connexion</Link>}</Card></main></>;
};
