import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = login(email, password);
    if (!result.ok || !result.user) {
      showToast(result.message ?? "Connexion impossible.", "error");
      return;
    }
    navigate(result.user.role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-md items-center px-4 py-10">
        <Card>
          <h1 className="text-2xl font-bold text-brand-900">Connexion</h1>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">Email
              <input type="email" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Mot de passe
              <input type="password" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <Button type="submit">Se connecter</Button>
          </form>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate("/complete-profile")}>Continuer avec Google</Button>
          <p className="mt-5 text-sm text-stone-600">Pas encore de compte ? <Link className="font-bold text-brand-700" to="/register">Créer un compte</Link></p>
        </Card>
      </main>
    </>
  );
};
