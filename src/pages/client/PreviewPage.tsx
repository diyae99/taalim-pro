import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../components/Layout";
import { Button } from "../../components/Button";
import { PDFPreview } from "../../components/PDFPreview";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { generateExamPdf } from "../../lib/pdf";
import { getExams } from "../../lib/storage";

export const PreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const exam = getExams().find((item) => item.id === id);
  if (!exam || !user) {
    return <AppShell><div className="rounded-2xl border border-dashed border-brand-200 bg-white p-8 text-center">Examen introuvable.</div></AppShell>;
  }

  const download = () => {
    generateExamPdf(exam, user);
    showToast("PDF personnalisé généré avec succès.");
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>Retour</Button>
        <Button onClick={download}>Télécharger PDF</Button>
      </div>
      <PDFPreview exam={exam} user={user} />
    </AppShell>
  );
};
