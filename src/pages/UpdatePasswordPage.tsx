import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../lib/supabase";

export const UpdatePasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { session, user, loading, isRecoverySession, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (loading) return <><Navbar /><Loading /></>;
  const forcedChange = Boolean(session && user?.role === "teacher" && user.status === "active" && user.mustChangePassword);
  if (!session || (!isRecoverySession && !forcedChange)) return <><Navbar /><main className="mx-auto max-w-md px-4 py-16"><Card><h1 className="text-xl font-bold text-brand-900">Lien invalide ou expiré</h1><p className="mt-3 text-sm text-stone-600">Demandez un nouveau lien de réinitialisation pour continuer.</p><Link className="mt-5 inline-block text-sm font-bold text-brand-700" to="/forgot-password">Demander un nouveau lien</Link></Card></main></>;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (password.length < 8) {
      showToast("Le nouveau mot de passe doit contenir au moins 8 caractères.", "error");
      return;
    }
    if (password !== confirmation) {
      showToast("La confirmation du mot de passe ne correspond pas.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        showToast("Impossible de mettre à jour le mot de passe.", "error");
        return;
      }
      showToast("Votre mot de passe a été mis à jour avec succès.");
      await logout();
      navigate("/login", { replace: true });
    } catch {
      showToast("Une erreur est survenue pendant la mise à jour du mot de passe.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return <><Navbar /><main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-md items-center px-4 py-10"><Card><h1 className="text-2xl font-bold text-brand-900">Nouveau mot de passe</h1><form onSubmit={submit} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-semibold">Nouveau mot de passe<input type="password" autoComplete="new-password" required className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Confirmation du mot de passe<input type="password" autoComplete="new-password" required className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label><Button type="submit" disabled={submitting}>{submitting ? "Mise à jour…" : "Mettre à jour le mot de passe"}</Button></form></Card></main></>;
};
