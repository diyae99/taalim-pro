import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { useToast } from "../context/ToastContext";
import { supabase } from "../lib/supabase";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/update-password` });
      if (error) {
        showToast("Impossible d'envoyer l'email de réinitialisation pour le moment.", "error");
      } else {
        setSent(true);
      }
    } catch {
      showToast("Impossible de contacter le service. Vérifiez votre connexion internet.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return <><Navbar /><main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-md items-center px-4 py-10"><Card><h1 className="text-2xl font-bold text-brand-900">Mot de passe oublié</h1>{sent ? <div className="mt-5"><p className="text-sm leading-6 text-stone-600">Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être envoyé.</p><Link className="mt-4 inline-block text-sm font-bold text-brand-700" to="/login">Retour à la connexion</Link></div> : <form onSubmit={submit} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-semibold">Email<input type="email" autoComplete="email" required className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} /></label><Button type="submit" disabled={submitting}>{submitting ? "Envoi…" : "Envoyer le lien"}</Button></form>}</Card></main></>;
};
