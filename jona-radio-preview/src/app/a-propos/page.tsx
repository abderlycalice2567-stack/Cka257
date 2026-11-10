import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { DemoNotice } from "@/components/ui/demo-notice";
import { ShieldIcon, HeartIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "À propos",
  description: "La mission et l’histoire de Jona Radio (page de démonstration).",
};

const values = [
  { icon: HeartIcon, title: "Foi", text: "Annoncer l’Évangile et encourager une foi vivante au quotidien." },
  { icon: CheckIcon, title: "Espérance", text: "Porter un message d’espoir à travers la musique et la parole." },
  { icon: ShieldIcon, title: "Proximité", text: "Accompagner les auditeurs partout, sur tous leurs appareils." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="À propos"
        title="Une voix d’espoir, de foi et d’inspiration"
        description="Jona Radio est une radio chrétienne en ligne, en français. Cette page présente la station dans la maquette proposée."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="prose-light max-w-none">
            <DemoNotice title="À confirmer par le propriétaire">
              L’histoire détaillée, l’équipe, les biographies et les affiliations ne sont pas
              inventées ici. Les éléments ci-dessous sont volontairement généraux et seront
              remplacés par le contenu officiel fourni par la station.
            </DemoNotice>
            <h2 className="mt-8 text-2xl font-bold text-navy-900">Notre mission</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate">
              Proposer une programmation chrétienne — méditations, louange, enseignements et
              moments de prière — qui nourrit la foi et inspire le quotidien, accessible librement
              en ligne.
            </p>
            <h2 className="mt-8 text-2xl font-bold text-navy-900">Ce que propose la station</h2>
            <ul className="mt-3 space-y-2 text-slate">
              <li>• Diffusion en continu, en français.</li>
              <li>• Des émissions régulières (voir la grille).</li>
              <li>• Un lien avec la communauté via la prière et le contact.</li>
            </ul>
          </div>
          <aside className="space-y-4">
            {values.map((v) => (
              <div key={v.title} className="card p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-800">
                  <v.icon width={18} height={18} />
                </span>
                <h3 className="mt-4 font-bold text-navy-900">{v.title}</h3>
                <p className="mt-1 text-sm text-slate">{v.text}</p>
              </div>
            ))}
          </aside>
        </div>
      </Section>
      <Section tone="muted">
        <SectionHeading align="center" eyebrow="Transparence" title="Une maquette honnête" description="Nous n’affichons aucune statistique d’audience, témoignage ou affiliation non vérifiés." />
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-3">
          <Badge tone="muted">Aucune donnée inventée</Badge>
          <Badge tone="muted">Contenu de démo étiqueté</Badge>
          <Badge tone="muted">Coordonnées à confirmer</Badge>
        </div>
      </Section>
    </>
  );
}
