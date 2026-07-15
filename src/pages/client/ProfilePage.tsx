import { FormEvent, useState } from "react";
import { AppShell } from "../../components/Layout";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fileToDataUrl } from "../../lib/storage";

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(user);
  if (!user || !form) return null;

  const update = (field: string, value: string) => setForm((current) => current ? { ...current, [field]: value } : current);
  const logo = async (file?: File) => {
    if (file) update("logo", await fileToDataUrl(file));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile(form);
    showToast("Profil mis à jour.");
  };

  return (
    <AppShell>
      <Card>
        <h1 className="text-2xl font-bold text-brand-900">Profil établissement</h1>
        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          {(["fullName", "email", "phone", "schoolName", "city"] as const).map((field) => (
            <label key={field} className="grid gap-2 text-sm font-semibold">
              {{ fullName: "Nom complet", email: "Email", phone: "Téléphone", schoolName: "Nom de l'établissement", city: "Ville" }[field]}
              <input className="focus-ring rounded-xl border border-brand-200 px-3 py-2" value={form[field]} onChange={(e) => update(field, e.target.value)} />
            </label>
          ))}
          <div className="rounded-xl bg-brand-50 p-4 text-sm">
            <p className="font-bold text-brand-900">Niveau</p>
            <p className="mt-1 text-stone-700">{form.schoolLevel || "Non renseigné"}</p>
          </div>
          <div className="rounded-xl bg-brand-50 p-4 text-sm">
            <p className="font-bold text-brand-900">Matière</p>
            <p className="mt-1 text-stone-700">{form.schoolSubject || "Non renseigné"}</p>
          </div>
          <label className="grid gap-2 text-sm font-semibold">Logo
            <input type="file" accept="image/*" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" onChange={(e) => logo(e.target.files?.[0])} />
          </label>
          <div className="md:col-span-2"><Button type="submit">Enregistrer</Button></div>
        </form>
      </Card>
    </AppShell>
  );
};
