import type { Metadata } from "next";
import { localizedMeta, resolveLocale, sp } from "@/lib/page";
import { pick } from "@/lib/i18n/config";
import { listCategories, listPresenters, listPrograms, searchEpisodes } from "@/modules/catalog";
import { EmptyState, EpisodeCard, PageHeader, Pagination } from "@/components/ui/blocks";
import * as I from "@/components/icons";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/podcasts", t.pages.podcastsTitle, t.pages.podcastsIntro);
}

export default async function PodcastsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const q = await searchParams;
  const f = {
    q: sp(q.q),
    program: sp(q.program) || undefined,
    category: sp(q.category) || undefined,
    language: sp(q.language) || undefined,
    presenter: sp(q.presenter) || undefined,
    from: /^\d{4}-\d{2}-\d{2}$/.test(sp(q.from) ?? "") ? sp(q.from) : undefined,
    to: /^\d{4}-\d{2}-\d{2}$/.test(sp(q.to) ?? "") ? sp(q.to) : undefined,
    sort: (["newest", "oldest", "relevance"].includes(sp(q.sort) ?? "") ? sp(q.sort) : undefined) as "newest" | "oldest" | "relevance" | undefined,
    page: Number(sp(q.page)) || 1,
  };
  const [res, programs, categories, presenters] = await Promise.all([searchEpisodes(f), listPrograms(), listCategories(), listPresenters()]);
  const qs = (page: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v && k !== "page") u.set(k, String(v));
    if (page > 1) u.set("page", String(page));
    return `/${locale}/podcasts?${u.toString()}`;
  };
  const active = Object.entries(f).some(([k, v]) => k !== "page" && v);

  return (
    <>
      <PageHeader eyebrow={t.nav.podcasts} title={t.pages.podcastsTitle} intro={t.pages.podcastsIntro}>
        <form role="search" action={`/${locale}/podcasts`} className="flex max-w-2xl gap-2">
          <label htmlFor="q" className="sr-only">{t.nav.search}</label>
          <input id="q" name="q" defaultValue={f.q} placeholder={t.pages.searchPlaceholder} className="input !border-ivory/20 !bg-ivory/10 !text-ivory placeholder:!text-ivory/50" />
          <button className="btn-gold" type="submit"><I.Search size={16} /> <span className="hidden sm:inline">{t.nav.search}</span></button>
        </form>
      </PageHeader>
      <div className="container grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        <form action={`/${locale}/podcasts`} className="card h-fit space-y-4 p-5" aria-label={t.common.filter}>
          {f.q && <input type="hidden" name="q" value={f.q} />}
          <div>
            <label className="label" htmlFor="program">{t.nav.programs}</label>
            <select id="program" name="program" defaultValue={f.program ?? ""} className="input">
              <option value="">—</option>
              {programs.map((p) => <option key={p.slug} value={p.slug}>{pick(p.title, locale)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="category">{t.common.category}</label>
            <select id="category" name="category" defaultValue={f.category ?? ""} className="input">
              <option value="">{t.common.allCategories}</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{pick(c.name, locale)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="presenter">{t.nav.presenters}</label>
            <select id="presenter" name="presenter" defaultValue={f.presenter ?? ""} className="input">
              <option value="">—</option>
              {presenters.map((p) => <option key={p.slug} value={p.slug}>{p.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="language">{t.common.language}</label>
            <select id="language" name="language" defaultValue={f.language ?? ""} className="input">
              <option value="">{t.common.allLanguages}</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ht">Kreyòl</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label" htmlFor="from">From</label>
              <input id="from" type="date" name="from" defaultValue={f.from} className="input !px-2" />
            </div>
            <div>
              <label className="label" htmlFor="to">To</label>
              <input id="to" type="date" name="to" defaultValue={f.to} className="input !px-2" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="sort">Sort</label>
            <select id="sort" name="sort" defaultValue={f.sort ?? ""} className="input">
              <option value="">{f.q ? "Relevance" : "Newest"}</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-gold btn-sm flex-1">{t.common.filter}</button>
            {active && <a href={`/${locale}/podcasts`} className="btn-outline btn-sm">{t.common.reset}</a>}
          </div>
        </form>
        <div>
          <p className="mb-4 text-sm text-muted" aria-live="polite">{res.total} {t.common.results}</p>
          {res.items.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {res.items.map((e) => <EpisodeCard key={e.id} e={e} locale={locale} t={t} />)}
            </div>
          ) : <EmptyState>{t.common.none}</EmptyState>}
          <Pagination page={res.page} total={res.total} pageSize={res.pageSize} hrefFor={qs} labels={{ next: t.common.next, previous: t.common.previous }} />
        </div>
      </div>
    </>
  );
}
