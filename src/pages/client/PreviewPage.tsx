import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../components/Layout";
import { Button } from "../../components/Button";
import { PDFPreview } from "../../components/PDFPreview";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getExamFile } from "../../lib/examFiles";
import {
  createPersonalizedExamPreviewUrl,
  downloadPersonalizedExamPdf,
  generatePersonalizedExamPdf,
  sanitizePdfFilename
} from "../../lib/personalizedExamPdf";
import type { PersonalizedExamHeaderData } from "../../lib/personalizedExamPdf";
import { getExams } from "../../lib/storage";

type PersonalizationForm = {
  schoolName: string;
  academicYear: string;
  teacherName: string;
  supervisorName: string;
  level: string;
  group: string;
};

type RequestedAction = "download" | "preview";
type TemporaryLogo = Pick<PersonalizedExamHeaderData, "logoBytes" | "logoMimeType">;

const currentAcademicYear = () => {
  const now = new Date();
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}/${startYear + 1}`;
};

const dataUrlToLogo = (dataUrl?: string): TemporaryLogo => {
  if (!dataUrl) return {};
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
  if (!match) return {};
  const binary = window.atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { logoBytes: bytes.buffer, logoMimeType: match[1] as "image/png" | "image/jpeg" };
};

export const PreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const exam = getExams().find((item) => item.id === id);
  const [requestedAction, setRequestedAction] = useState<RequestedAction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [temporaryLogo, setTemporaryLogo] = useState<TemporaryLogo>({});
  const [logoError, setLogoError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const initialForm = useMemo<PersonalizationForm>(() => ({
    schoolName: user?.schoolName ?? "",
    academicYear: currentAcademicYear(),
    teacherName: user?.fullName ?? "",
    supervisorName: "",
    level: user?.schoolLevel ?? exam?.level ?? "",
    group: ""
  }), [exam?.level, user?.fullName, user?.schoolLevel, user?.schoolName]);
  const [form, setForm] = useState<PersonalizationForm>(initialForm);

  useEffect(() => setForm(initialForm), [initialForm]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  if (!exam || !user) {
    return <AppShell><div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center">Examen introuvable.</div></AppShell>;
  }

  const chooseLogo = async (file?: File) => {
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setLogoError("Le logo sélectionné doit être au format PNG ou JPEG.");
      setTemporaryLogo({});
      return;
    }
    setLogoError("");
    setTemporaryLogo({ logoBytes: await file.arrayBuffer(), logoMimeType: file.type });
  };

  const generate = async (action: RequestedAction) => {
    if (!exam.filePath) throw new Error("Le fichier PDF original est introuvable.");
    const originalPdf = await getExamFile(exam.filePath);
    if (!originalPdf) throw new Error("Le fichier PDF original est introuvable.");
    const savedLogo = dataUrlToLogo(user.logo);
    const header: PersonalizedExamHeaderData = {
      schoolName: form.schoolName.trim(),
      academicYear: form.academicYear.trim(),
      teacherName: form.teacherName.trim(),
      supervisorName: form.supervisorName.trim() || undefined,
      level: form.level.trim() || exam.level,
      group: form.group.trim() || undefined,
      ...savedLogo,
      ...temporaryLogo
    };
    const personalizedPdf = await generatePersonalizedExamPdf(originalPdf, header, {
      replaceLegacyHeader: exam.replaceLegacyHeader ?? true,
      headerHeightRatio: exam.headerHeightRatio ?? 0.13,
      applyHeaderToAllPages: exam.applyHeaderToAllPages ?? false
    });

    if (action === "download") {
      downloadPersonalizedExamPdf(personalizedPdf, sanitizePdfFilename(exam.title, form.schoolName, form.teacherName));
      showToast("Le PDF personnalisé a été généré avec succès.");
      return;
    }
    const nextUrl = createPersonalizedExamPreviewUrl(personalizedPdf);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextUrl;
    });
  };

  const submitPersonalization = async (event: FormEvent) => {
    event.preventDefault();
    if (!requestedAction || isGenerating || logoError) return;
    if (!form.schoolName.trim() || !form.academicYear.trim() || !form.teacherName.trim() || !form.level.trim()) {
      showToast("Veuillez renseigner l'établissement, l'année scolaire, le professeur et le niveau.", "error");
      return;
    }
    setIsGenerating(true);
    try {
      await generate(requestedAction);
      setRequestedAction(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Une erreur est survenue pendant la génération du PDF.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>Retour</Button>
        {exam.filePath && exam.fileName && <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={isGenerating} onClick={() => setRequestedAction("preview")}>Aperçu personnalisé</Button><Button disabled={isGenerating} onClick={() => setRequestedAction("download")}>{isGenerating ? "Génération du PDF…" : "Générer et télécharger le PDF"}</Button></div>}
      </div>
      <PDFPreview exam={exam} user={user} personalizedPreviewUrl={previewUrl} />

      {requestedAction && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="personalization-title">
          <form onSubmit={submitPersonalization} className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="personalization-title" className="text-xl font-bold text-brand-900">Personnaliser l'en-tête</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ModalField label="Nom de l'établissement"><input required className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.schoolName} onChange={(event) => setForm({ ...form, schoolName: event.target.value })} /></ModalField>
              <ModalField label="Année scolaire"><input required className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} /></ModalField>
              <ModalField label="Nom du professeur"><input required className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.teacherName} onChange={(event) => setForm({ ...form, teacherName: event.target.value })} /></ModalField>
              <ModalField label="Nom du surveillant"><input className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.supervisorName} onChange={(event) => setForm({ ...form, supervisorName: event.target.value })} /></ModalField>
              <ModalField label="Niveau"><input required className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })} /></ModalField>
              <ModalField label="Groupe"><input className="focus-ring h-11 rounded-xl border border-brand-200 px-3" value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })} /></ModalField>
              <div className="md:col-span-2"><ModalField label="Logo de l'établissement"><input type="file" accept="image/png,image/jpeg" className="focus-ring rounded-xl border border-brand-200 px-3 py-2" onChange={(event) => void chooseLogo(event.target.files?.[0])} />{logoError && <span className="text-xs font-semibold text-red-700">{logoError}</span>}</ModalField></div>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="secondary" disabled={isGenerating} onClick={() => setRequestedAction(null)}>Annuler</Button><Button type="submit" disabled={isGenerating || Boolean(logoError)}>{isGenerating ? "Génération du PDF…" : requestedAction === "preview" ? "Générer l'aperçu" : "Générer et télécharger"}</Button></div>
          </form>
        </div>
      )}
    </AppShell>
  );
};

const ModalField = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="grid gap-1.5 text-sm font-semibold text-ink"><span>{label}</span>{children}</label>;
