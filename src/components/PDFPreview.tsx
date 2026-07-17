import { useEffect, useState } from "react";
import { Card } from "./Card";
import { formatFileSize, getExamFile } from "../lib/examFiles";
import type { Exam, User } from "../types";

const languageLabels = { fr: "Français", ar: "Arabe", en: "Anglais" } as const;

export const PDFPreview = ({ exam, user, personalizedPreviewUrl }: { exam: Exam; user: User; personalizedPreviewUrl?: string | null }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(exam.filePath));
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    setPreviewUrl(null);
    setPreviewError(false);
    setIsLoading(Boolean(exam.filePath) && !personalizedPreviewUrl);

    if (!exam.filePath || personalizedPreviewUrl) return () => { isMounted = false; };

    void getExamFile(exam.filePath)
      .then((file) => {
        if (!isMounted) return;
        if (!file) {
          setPreviewError(true);
          setIsLoading(false);
          return;
        }
        objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setPreviewError(true);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [exam.filePath, personalizedPreviewUrl]);

  const displayedPreviewUrl = personalizedPreviewUrl ?? previewUrl;

  return (
    <Card className="bg-white">
      <div className="border-b border-brand-100 pb-5">
        <div className="flex items-center gap-4">
          {user.logo ? <img src={user.logo} alt="Logo établissement" className="h-16 w-16 rounded-xl object-contain" /> : <div className="grid h-16 w-16 place-items-center rounded-xl border text-xs text-stone-500">Logo</div>}
          <div><h2 className="text-2xl font-bold text-brand-900">{user.schoolName}</h2><p className="text-sm text-stone-600">{user.city}</p></div>
        </div>
      </div>
      <div className="grid gap-4 pt-6">
        <h1 className="text-2xl font-bold text-ink">{exam.title}</h1>
        <p className="text-sm text-stone-600">{exam.type} · {exam.subject} · {exam.level} · {exam.semester}{exam.language ? ` · ${languageLabels[exam.language]}` : ""}</p>
        {exam.themes?.length ? <div><h3 className="font-bold text-brand-900">Thèmes</h3><p className="mt-1 text-sm text-stone-700">{exam.themes.join(", ")}</p></div> : null}
        {exam.instructions && <div><h3 className="font-bold text-brand-900">Instructions</h3><p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">{exam.instructions}</p></div>}

        {exam.fileName && (
          <section className="mt-2 grid gap-3" aria-labelledby="exam-preview-title">
            <h2 id="exam-preview-title" className="text-xl font-bold text-brand-900">{personalizedPreviewUrl ? "Aperçu avec en-tête personnalisé" : "Aperçu de l'examen"}</h2>
            <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-brand-100 bg-stone-100 p-2 shadow-sm sm:p-3">
              {isLoading && <div className="grid h-[500px] place-items-center text-sm font-semibold text-stone-600 md:h-[700px]">Chargement de l'aperçu…</div>}
              {previewError && <div className="grid h-[500px] place-items-center px-4 text-center text-sm font-semibold text-red-700 md:h-[700px]">Impossible d'afficher l'aperçu de ce PDF.</div>}
              {displayedPreviewUrl && !previewError && (
                <iframe
                  className="h-[500px] w-full rounded-xl bg-white md:h-[700px]"
                  src={`${displayedPreviewUrl}#toolbar=0&navpanes=0`}
                  title={`Aperçu du PDF ${exam.fileName}`}
                  onError={() => setPreviewError(true)}
                />
              )}
            </div>
            <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-stone-600">
              <p><span className="font-semibold text-ink">Nom du fichier :</span> <span className="break-all">{exam.fileName}</span></p>
              {exam.fileSize != null && <p className="mt-1"><span className="font-semibold text-ink">Taille du fichier :</span> {formatFileSize(exam.fileSize)}</p>}
            </div>
          </section>
        )}

        {!exam.fileName && exam.content && <pre className="whitespace-pre-wrap rounded-xl bg-brand-50 p-4 font-sans text-sm leading-7 text-ink">{exam.content}</pre>}
        <p className="text-xs text-stone-500">Ajouté le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(exam.createdAt))}</p>
      </div>
    </Card>
  );
};
