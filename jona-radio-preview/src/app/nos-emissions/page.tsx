import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { ProgramCard } from "@/components/ui/program-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Reveal } from "@/components/ui/reveal";
import { programs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Nos émissions",
  description: "La grille des émissions de Jona Radio (démonstration).",
};

export default function ProgramsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Grille des programmes"
        title="Nos émissions"
        description="Méditations, louange, enseignements et rendez-vous pour toute la famille."
      />
      <Section>
        <div className="mb-8">
          <DemoNotice title="Contenu de démonstration">
            « Méditation du matin » est confirmée sur le site public ; les autres émissions, leurs
            animateurs et horaires sont des exemples destinés à illustrer la mise en page. Ils
            seraient remplacés par les informations fournies par la station.
          </DemoNotice>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 80}>
              <ProgramCard program={p} />
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
