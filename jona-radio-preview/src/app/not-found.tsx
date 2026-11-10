import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="mt-3 text-4xl font-bold text-navy-900">Page introuvable</h1>
      <p className="mt-3 max-w-md text-slate">
        Cette page n’existe pas dans la maquette. Retournez à l’accueil pour continuer la visite.
      </p>
      <Link href="/" className="btn-gold mt-8">
        Retour à l’accueil
      </Link>
    </div>
  );
}
