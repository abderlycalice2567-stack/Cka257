import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/section";
import { DemoNotice } from "@/components/ui/demo-notice";
import { ListenButton } from "@/components/player/listen-button";
import { ArrowIcon } from "@/components/icons";
import { getProgram, programs } from "@/lib/content";

export function generateStaticParams() {
  return programs.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const program = getProgram(params.slug);
  if (!program) return { title: "Émission introuvable" };
  return { title: program.title, description: program.summary };
}

export default function ProgramDetail({ params }: { params: { slug: string } }) {
  const program = getProgram(params.slug);
  if (!program) notFound();

  const related = programs.filter((p) => p.slug !== program.slug).slice(0, 3);

  return (
    <>
      <PageHeader eyebrow={program.category} title={program.title}>
        <div className="flex flex-wrap items-center gap-3 text-sm text-ivory/80">
          <Badge tone="gold">{program.sourced ? "Émission confirmée" : "Exemple démo"}</Badge>
          <span>Animé par {program.host}</span>
          <span aria-hidden>·</span>
          <span>{program.schedule}</span>
          <span aria-hidden>·</span>
          <span>{program.duration}</span>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          <article className="prose-light max-w-none">
            {!program.sourced && (
              <div className="mb-6">
                <DemoNotice>
                  Les détails de cette émission (animateur, horaire, description) sont des exemples
                  de démonstration à remplacer par les informations officielles de la station.
                </DemoNotice>
              </div>
            )}
            {program.description.map((para, i) => (
              <p key={i} className="mb-4 text-lg leading-relaxed text-slate">
                {para}
              </p>
            ))}
            <div className="mt-8 flex flex-wrap gap-3">
              <ListenButton />
              <Link href="/nos-emissions" className="btn-outline">
                Retour à la grille
              </Link>
            </div>
          </article>

          <aside className="space-y-4">
            <div className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-700">Informations</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Catégorie</dt>
                  <dd className="font-medium text-navy-900">{program.category}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Animation</dt>
                  <dd className="font-medium text-navy-900">{program.host}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Diffusion</dt>
                  <dd className="text-right font-medium text-navy-900">{program.schedule}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Durée</dt>
                  <dd className="font-medium text-navy-900">{program.duration}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-bold text-navy-900">À découvrir également</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <Link key={p.slug} href={`/nos-emissions/${p.slug}`} className="card card-hover flex items-center justify-between gap-3 p-4">
                <span className="text-sm font-semibold text-navy-900">{p.title}</span>
                <ArrowIcon width={16} height={16} className="text-gold-700" />
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
