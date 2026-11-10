import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Section, Badge } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { news } from "@/lib/content";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Annonces et nouvelles de Jona Radio (exemples de démonstration).",
};

export default function NewsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Actualités"
        title="Nouvelles & annonces"
        description="Les dernières informations de la station. Exemples de démonstration dans cette maquette."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((n, i) => (
            <Reveal key={n.slug} delay={(i % 3) * 80}>
              <Link href={`/actualites/${n.slug}`} className="card card-hover flex h-full flex-col p-6">
                <div className="flex items-center gap-2 text-xs">
                  <Badge tone="muted">{n.category}</Badge>
                  {n.demo && <span className="font-semibold uppercase text-gold-700">démo</span>}
                </div>
                <h2 className="mt-4 text-lg font-bold text-navy-900">{n.title}</h2>
                <p className="mt-2 flex-1 text-sm text-slate">{n.excerpt}</p>
                <time className="mt-4 text-xs text-slate" dateTime={n.date}>
                  {new Date(n.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
