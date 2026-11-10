import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Section, Badge } from "@/components/ui/section";
import { DemoNotice } from "@/components/ui/demo-notice";
import { getNews, news } from "@/lib/content";

export function generateStaticParams() {
  return news.map((n) => ({ slug: n.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const item = getNews(params.slug);
  if (!item) return { title: "Article introuvable" };
  return { title: item.title, description: item.excerpt };
}

export default function NewsDetail({ params }: { params: { slug: string } }) {
  const item = getNews(params.slug);
  if (!item) notFound();

  return (
    <>
      <PageHeader eyebrow={item.category} title={item.title}>
        <time className="text-sm text-ivory/70" dateTime={item.date}>
          {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </time>
      </PageHeader>
      <Section>
        <article className="mx-auto max-w-2xl">
          {item.demo && (
            <div className="mb-6">
              <DemoNotice title="Article de démonstration">
                Le contenu de cet article est fictif et sert uniquement à illustrer la mise en page.
              </DemoNotice>
            </div>
          )}
          {item.body.map((para, i) => (
            <p key={i} className="mb-4 text-lg leading-relaxed text-slate">
              {para}
            </p>
          ))}
          <div className="mt-8 flex items-center gap-3">
            <Badge tone="muted">{item.category}</Badge>
            <Link href="/actualites" className="text-sm font-semibold text-navy-800 underline">
              ← Toutes les actualités
            </Link>
          </div>
        </article>
      </Section>
    </>
  );
}
