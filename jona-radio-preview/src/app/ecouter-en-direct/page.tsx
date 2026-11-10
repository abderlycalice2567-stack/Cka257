import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section, SectionHeading } from "@/components/ui/section";
import { LivePanel } from "@/components/player/live-panel";
import { ProgramCard } from "@/components/ui/program-card";
import { programs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Écouter en direct",
  description: "Lecteur radio en direct de Jona Radio (démonstration).",
};

export default function ListenPage() {
  return (
    <>
      <PageHeader
        eyebrow="En direct"
        title="Écoutez Jona Radio en direct"
        description="Lancez le flux et laissez-le vous accompagner. La lecture se poursuit pendant que vous naviguez sur le site."
      />
      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="lg:sticky lg:top-24">
            {/* The LivePanel uses the shared persistent player. */}
            <div className="rounded-3xl bg-navy-900 p-6 sm:p-8">
              <LivePanel />
            </div>
            <ul className="mt-6 space-y-2 text-sm text-slate">
              <li>• Compatible mobile (iOS / Android) et ordinateur.</li>
              <li>• Commandes accessibles au clavier et aux lecteurs d’écran.</li>
              <li>• Réglage du volume et sourdine ; reprise après coupure réseau.</li>
              <li>• L’indicateur « En direct » ne s’affiche que si le flux est réellement connecté.</li>
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Pendant l’écoute" title="Au programme aujourd’hui" description="Aperçu de la grille (exemples de démonstration sauf mention « confirmé »)." />
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {programs.slice(0, 4).map((p) => (
                <ProgramCard key={p.slug} program={p} />
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
