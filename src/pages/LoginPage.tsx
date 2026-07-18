import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const destinationFor = (role: "platform_admin" | "teacher", status: string) => {
  if (status === "pending") return "/account-pending";
  if (status === "suspended") return "/account-suspended";
  if (status === "rejected") return "/account-rejected";
  return role === "platform_admin" ? "/admin" : "/dashboard";
};

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok || !result.user) {
      showToast(result.message ?? "Connexion impossible.", "error");
      return;
    }
    navigate(destinationFor(result.user.role, result.user.status), { replace: true });
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-md items-center px-4 py-10">
        <Card>
          <h1 className="text-2xl font-bold text-brand-900">Connexion</h1>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">Email
              <input type="email" autoComplete="email" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Mot de passe
              <input type="password" autoComplete="current-password" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <div className="text-right"><Link className="text-sm font-bold text-brand-700" to="/forgot-password">Mot de passe oublié ?</Link></div>
            <Button type="submit" disabled={submitting}>{submitting ? "Connexion…" : "Se connecter"}</Button>
          </form>
          <p className="mt-5 text-sm text-stone-600">Pas encore de compte ? <Link className="font-bold text-brand-700" to="/register">Créer un compte</Link></p>
        </Card>
      </main>
    </>
  );
};
