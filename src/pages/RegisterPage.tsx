import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fileToDataUrl, getUsers, makeId } from "../lib/storage";
import { registrationLevels, registrationSubjects } from "../data/options";
import type { User } from "../types";

interface RegisterForm {
  fullName: string;
  email: string;
  phone: string;
  schoolName: string;
  city: string;
  schoolLevel: string;
  schoolSubject: string;
  logo?: string;
  password: string;
  confirm: string;
}

const initial: RegisterForm = { fullName: "", email: "", phone: "", schoolName: "", city: "", schoolLevel: "", schoolSubject: "", password: "", confirm: "" };

export const RegisterPage = ({ googleMode = false }: { googleMode?: boolean }) => {
  const [form, setForm] = useState<RegisterForm>(initial);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const set = (field: keyof RegisterForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const onLogo = async (file?: File) => {
    if (file) set("logo", await fileToDataUrl(file));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!googleMode && form.password !== form.confirm) {
      showToast("La confirmation du mot de passe ne correspond pas.", "error");
      return;
    }
    if (getUsers().some((user) => user.email.toLowerCase() === form.email.toLowerCase())) {
      showToast("Cet email existe déjà.", "error");
      return;
    }
    const user: User = {
      id: makeId("user"),
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      schoolName: form.schoolName,
      city: form.city,
      schoolLevel: form.schoolLevel,
      schoolSubject: form.schoolSubject,
      logo: form.logo,
      password: googleMode ? makeId("google") : form.password,
      role: "client",
      status: "pending",
      createdAt: new Date().toISOString()
    };
    register(user);
    showToast("Votre demande a été envoyée. L'administrateur doit activer votre compte.", "info");
    navigate("/login");
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <h1 className="text-2xl font-bold text-brand-900">{googleMode ? "Compléter le profil" : "Créer un compte client"}</h1>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom complet" value={form.fullName} onChange={(v) => set("fullName", v)} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
              <Field label="Téléphone" value={form.phone} onChange={(v) => set("phone", v)} />
              <Field label="Nom de l'établissement" value={form.schoolName} onChange={(v) => set("schoolName", v)} />
              <Field label="Ville" value={form.city} onChange={(v) => set("city", v)} />
              <label className="grid gap-2 text-sm font-semibold">Niveau
                <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.schoolLevel} onChange={(e) => set("schoolLevel", e.target.value)} required>
                  <option value="">Choisir un niveau</option>
                  {registrationLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Matière
                <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.schoolSubject} onChange={(e) => set("schoolSubject", e.target.value)} required>
                  <option value="">Choisir une matière</option>
                  {registrationSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Logo de l'établissement
                <input type="file" accept="image/*" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" onChange={(e) => onLogo(e.target.files?.[0])} />
              </label>
              {!googleMode && (
                <>
                  <Field label="Mot de passe" type="password" value={form.password} onChange={(v) => set("password", v)} />
                  <Field label="Confirmation mot de passe" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} />
                </>
              )}
            </div>
            <Button type="submit">{googleMode ? "Terminer" : "Créer mon compte"}</Button>
          </form>
        </Card>
      </main>
    </>
  );
};

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => (
  <label className="grid gap-2 text-sm font-semibold">{label}
    <input type={type} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} required />
  </label>
);
