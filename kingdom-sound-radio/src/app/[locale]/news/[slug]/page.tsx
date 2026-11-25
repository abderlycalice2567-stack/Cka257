import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { formatDate } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/config";
import { env } from "@/lib/env";
import { getArticle } from "@/modules/content";
import { Markdown } from "@/lib/markdown";
import { SampleBadge } from "@/components/ui/blocks";
import { ShareButton } from "@/components/site/engagement";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const a = await getArticle(locale, slug);
  return a ? { ...localizedMeta(locale, `/news/${slug}`, a.title, a.excerpt), alternates: { canonical: `${env.appUrl}/${locale}/news/${slug}` } } : {};
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const a = await getArticle(locale, slug);
  if (!a) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: a.title, datePublished: a.published_at.toISOString(), inLanguage: locale, publisher: { "@type": "Organization", name: "The Kingdom Sound Radio" } };
  return (
    <article className="container max-w-3xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href={`/${locale}/news`} className="text-sm font-semibold text-accent hover:underline">← {t.nav.news}</Link>
      <div className="mt-6 flex items-center gap-2">
        <span className="eyebrow">{a.category}</span>
        {a.is_sample && <SampleBadge label={t.common.sample} />}
      </div>
      <h1 className="mt-2 text-3xl font-bold md:text-5xl">{a.title}</h1>
      <p className="mt-3 text-sm text-muted">{formatDate(a.published_at, locale)}</p>
      <div className="mt-4"><ShareButton url={`/${locale}/news/${slug}`} title={a.title} labels={{ share: t.common.share, copied: t.common.copied }} /></div>
      <Markdown source={a.body} className="mt-8" />
    </article>
  );
}
