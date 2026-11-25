import type { Metadata } from "next";
import Link from "next/link";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { formatDate } from "@/lib/i18n";
import { listArticles } from "@/modules/content";
import { EmptyState, PageHeader, SampleBadge } from "@/components/ui/blocks";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/news", t.pages.newsTitle);
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const articles = await listArticles(locale, 50);
  return (
    <>
      <PageHeader eyebrow={t.nav.news} title={t.pages.newsTitle} />
      <div className="container py-10">
        {articles.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/${locale}/news/${a.slug}`} className="card flex flex-col gap-2 p-6 hover:shadow-lift">
                <div className="flex items-center gap-2">
                  <span className="eyebrow !text-[10px]">{a.category}</span>
                  {a.is_sample && <SampleBadge label={t.common.sample} />}
                </div>
                <h2 className="text-lg font-semibold">{a.title}</h2>
                <p className="line-clamp-3 text-sm text-muted">{a.excerpt}</p>
                <p className="mt-auto pt-2 text-xs text-muted">{formatDate(a.published_at, locale)}</p>
              </Link>
            ))}
          </div>
        ) : <EmptyState>{t.common.none}</EmptyState>}
      </div>
    </>
  );
}
