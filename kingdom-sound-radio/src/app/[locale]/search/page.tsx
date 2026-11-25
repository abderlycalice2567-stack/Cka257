import type { Metadata } from "next";
import Link from "next/link";
import { localizedMeta, resolveLocale, sp } from "@/lib/page";
import { pick } from "@/lib/i18n/config";
import { sql } from "@/lib/db";
import { searchEpisodes } from "@/modules/catalog";
import { EmptyState, EpisodeCard, PageHeader } from "@/components/ui/blocks";
import * as I from "@/components/icons";
import type { Tr } from "@/modules/catalog";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return { ...localizedMeta(locale, "/search", t.pages.searchTitle), robots: { index: false } };
}

export default async function SearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const q = (sp((await searchParams).q) ?? "").trim().slice(0, 120);
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const [episodes, programs, articles, presenters] = q
    ? await Promise.all([
        searchEpisodes({ q, pageSize: 8 }),
        sql<{ slug: string; title: Tr }[]>`SELECT slug, title FROM programs WHERE status='published' AND (title::text ILIKE ${like} OR summary::text ILIKE ${like}) LIMIT 8`,
        sql<{ slug: string; title: string }[]>`SELECT slug, title FROM articles WHERE status='published' AND published_at <= now() AND locale=${locale} AND (title ILIKE ${like} OR body ILIKE ${like}) LIMIT 8`,
        sql<{ slug: string; display_name: string }[]>`SELECT slug, display_name FROM presenters WHERE published AND display_name ILIKE ${like} LIMIT 8`,
      ])
    : [null, [], [], []];
  const none = q && !episodes?.total && !programs.length && !articles.length && !presenters.length;
  return (
    <>
      <PageHeader eyebrow={t.nav.search} title={t.pages.searchTitle}>
        <form role="search" className="flex max-w-2xl gap-2">
          <label htmlFor="sq" className="sr-only">{t.nav.search}</label>
          <input id="sq" name="q" defaultValue={q} placeholder={t.pages.searchPlaceholder} className="input !border-ivory/20 !bg-ivory/10 !text-ivory placeholder:!text-ivory/50" autoFocus />
          <button className="btn-gold" type="submit"><I.Search size={16} /></button>
        </form>
      </PageHeader>
      <div className="container space-y-10 py-10">
        {none && <EmptyState>{t.common.none}</EmptyState>}
        {programs.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t.nav.programs}</h2>
            <ul className="flex flex-wrap gap-2">{programs.map((p) => <li key={p.slug}><Link className="btn-outline btn-sm" href={`/${locale}/programs/${p.slug}`}>{pick(p.title, locale)}</Link></li>)}</ul>
          </section>
        )}
        {presenters.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t.nav.presenters}</h2>
            <ul className="flex flex-wrap gap-2">{presenters.map((p) => <li key={p.slug}><Link className="btn-outline btn-sm" href={`/${locale}/presenters/${p.slug}`}>{p.display_name}</Link></li>)}</ul>
          </section>
        )}
        {episodes && episodes.items.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t.common.episodes}</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{episodes.items.map((e) => <EpisodeCard key={e.id} e={e} locale={locale} t={t} />)}</div>
            {episodes.total > episodes.items.length && <Link className="mt-4 inline-block link text-sm" href={`/${locale}/podcasts?q=${encodeURIComponent(q)}`}>{t.common.seeAll} ({episodes.total})</Link>}
          </section>
        )}
        {articles.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t.nav.news}</h2>
            <ul className="space-y-2">{articles.map((a) => <li key={a.slug}><Link className="link" href={`/${locale}/news/${a.slug}`}>{a.title}</Link></li>)}</ul>
          </section>
        )}
      </div>
    </>
  );
}
