import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { registrationLevels, registrationSubjects } from "../data/options";

interface RegisterForm {
  fullName: string;
  email: string;
  phone: string;
  schoolName: string;
  city: string;
  schoolLevel: string;
  schoolSubject: string;
  password: string;
  confirm: string;
}

const initial: RegisterForm = { fullName: "", email: "", phone: "", schoolName: "", city: "", schoolLevel: "", schoolSubject: "", password: "", confirm: "" };

export const RegisterPage = () => {
  const [form, setForm] = useState<RegisterForm>(initial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const set = (field: keyof RegisterForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const onLogo = async (file?: File) => {
    if (!file) {
      setLogoFile(null);
      return;
    }
    if (!(["image/png", "image/jpeg"] as const).includes(file.type as "image/png" | "image/jpeg")) {
      setLogoFile(null);
      showToast("Le logo doit être au format PNG ou JPEG.", "error");
      return;
    }
    if (file.size > 1024 * 1024) {
      setLogoFile(null);
      showToast("Le logo doit être une image de moins de 1 Mo.", "error");
      return;
    }
    setLogoFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("REGISTER_SUBMIT_STARTED");
    if (submitting) return;
    if (form.password.length < 8) {
      showToast("Le mot de passe doit contenir au moins 8 caractères.", "error");
      return;
    }
    if (form.password !== form.confirm) {
      showToast("La confirmation du mot de passe ne correspond pas.", "error");
      return;
    }
    const registrationData = {
      email: form.email.trim(),
      metadata: {
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        school_name: form.schoolName.trim(),
        city: form.city.trim(),
        school_level: form.schoolLevel,
        school_subject: form.schoolSubject
      },
      logo: logoFile ? { name: logoFile.name, size: logoFile.size, type: logoFile.type } : null
    };
    console.log("REGISTER_PAYLOAD", registrationData);

    setSubmitting(true);
    try {
      const result = await register({ ...registrationData, password: form.password, logoFile });
      if (!result.ok) {
        console.error("REGISTER_FAILED", result.error);
        showToast(result.message ?? "Impossible de créer le compte.", "error");
        return;
      }
      if (result.message) showToast(result.message, "info");
      navigate("/account-pending", { replace: true });
    } catch (error) {
      console.error("REGISTER_UNEXPECTED_ERROR", error);
      showToast("Une erreur inattendue est survenue pendant la création du compte.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <h1 className="text-2xl font-bold text-brand-900">Créer un compte client</h1>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom complet" value={form.fullName} onChange={(value) => set("fullName", value)} />
              <Field label="Email" type="email" value={form.email} onChange={(value) => set("email", value)} />
              <Field label="Téléphone" value={form.phone} onChange={(value) => set("phone", value)} />
              <Field label="Nom de l'établissement" value={form.schoolName} onChange={(value) => set("schoolName", value)} />
              <Field label="Ville" value={form.city} onChange={(value) => set("city", value)} />
              <label className="grid gap-2 text-sm font-semibold">Niveau
                <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.schoolLevel} onChange={(event) => set("schoolLevel", event.target.value)} required><option value="">Choisir un niveau</option>{registrationLevels.map((level) => <option key={level} value={level}>{level}</option>)}</select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Matière
                <select className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form.schoolSubject} onChange={(event) => set("schoolSubject", event.target.value)} required><option value="">Choisir une matière</option>{registrationSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Logo de l'établissement
                <input type="file" accept="image/png,image/jpeg" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" onChange={(event) => void onLogo(event.target.files?.[0])} />
              </label>
              <Field label="Mot de passe" type="password" value={form.password} onChange={(value) => set("password", value)} />
              <Field label="Confirmation mot de passe" type="password" value={form.confirm} onChange={(value) => set("confirm", value)} />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? "Création du compte…" : "Créer mon compte"}</Button>
          </form>
        </Card>
      </main>
    </>
  );
};

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => (
  <label className="grid gap-2 text-sm font-semibold">{label}<input type={type} autoComplete={type === "password" ? "new-password" : undefined} className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} required /></label>
);
