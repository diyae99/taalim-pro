import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Navbar } from "../components/Navbar";

const demoVideoPath = "/demo-taalim-pro.mp4";

export const LandingPage = () => {
  const [hasDemoVideo, setHasDemoVideo] = useState(false);

  useEffect(() => {
    fetch(demoVideoPath, { method: "HEAD" })
      .then((response) => setHasDemoVideo(response.ok))
      .catch(() => setHasDemoVideo(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="bg-paper">
        <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Banque d'examens personnalisable</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-brand-900 sm:text-5xl lg:text-6xl">
              Services d'évaluation et de préparation des examens
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
              Téléchargez des examens prêts à l'emploi, personnalisés avec le logo de votre établissement.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login"><Button>Connexion</Button></Link>
              <Link to="/register"><Button variant="secondary">Créer un compte</Button></Link>
            </div>
          </div>
          <div className="rounded-3xl border border-brand-100 bg-white p-4 shadow-soft">
            <div className="overflow-hidden rounded-2xl bg-brand-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700">Démo produit</span>
                <span className="text-xs font-semibold text-stone-500">30 secondes</span>
              </div>
              {hasDemoVideo ? (
                <video
                  className="aspect-video w-full rounded-2xl bg-ink object-cover"
                  src={demoVideoPath}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-brand-900">Vidéo de présentation — 30 secondes</p>
                    <p className="mt-2 text-sm text-stone-600">Ajoutez bientôt le fichier dans /public/demo-taalim-pro.mp4</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};
