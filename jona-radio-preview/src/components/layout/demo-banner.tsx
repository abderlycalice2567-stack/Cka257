import Link from "next/link";

/**
 * Always-visible notice (section 1 requirement): makes unmistakably clear that
 * this is an independent redesign PROPOSAL and NOT the official Jona Radio site.
 */
export function DemoBanner() {
  return (
    <div className="bg-gold-500 text-navy-900">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 py-1.5 text-center text-[12px] font-medium leading-snug">
        <span className="font-bold uppercase tracking-wide">Aperçu / Démonstration</span>
        <span className="hidden sm:inline">·</span>
        <span>
          Proposition de refonte indépendante — ceci n’est pas le site officiel de Jona Radio.
        </span>
        <Link href="/presentation" className="font-semibold underline underline-offset-2 hover:text-navy-700">
          Voir la présentation
        </Link>
      </div>
    </div>
  );
}
