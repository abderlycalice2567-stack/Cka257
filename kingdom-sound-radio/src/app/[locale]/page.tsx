import Link from "next/link";
import type { Metadata } from "next";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { formatDate } from "@/lib/i18n";
import { pick } from "@/lib/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { listPresenters, listPrograms, latestEpisodes } from "@/modules/catalog";
import { onAirAndNext } from "@/modules/schedule";
import { devotionalFor, featuredTestimonies, getSetting, getStation, listArticles, upcomingEvents, visiblePlatforms } from "@/modules/content";
import { userSets } from "@/modules/account";
import { NowNext } from "@/components/site/now-next";
import { ListenLiveButton } from "@/components/player/controls";
import { EmptyState, EpisodeCard, ProgramCard, SampleBadge, SectionHeader } from "@/components/ui/blocks";
import { Avatar } from "@/components/ui/art";
import { NewsletterForm } from "@/components/forms/public-forms";
import { FullLogo } from "@/components/site/logo";
import * as I from "@/components/icons";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "", undefined, t.meta.description);
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const L = (p: string) => `/${locale}${p}`;
  const station = await getStation();
  const [user, { current, upcoming }, episodes, featured, presenters, platforms, articles, events, devotional, testimonies, layout] = await Promise.all([
    getCurrentUser(),
    onAirAndNext(),
    latestEpisodes(8),
    listPrograms({ featured: true }),
    listPresenters(),
    visiblePlatforms(),
    listArticles(locale, 3),
    upcomingEvents(3),
    devotionalFor(locale, station.timezone),
    featuredTestimonies(2),
    getSetting<{ sections: string[] }>("homepage", { sections: [] }),
  ]);
  const sets = await userSets(user?.id);

  const sections: Record<string, React.ReactNode> = {
    hero: (
      <section key="hero" className="relative overflow-hidden bg-[#000F24] text-ivory">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: "radial-gradient(45% 65% at 75% 40%, rgba(37,99,235,.22), transparent 70%), radial-gradient(35% 50% at 10% 90%, rgba(212,175,55,.12), transparent 70%)" }} />
        <div className="container relative grid gap-6 pb-16 pt-8 md:pb-24 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-10 lg:pt-14">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl">{t.home.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-base text-ivory/75 md:text-lg">{t.home.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ListenLiveButton label={t.common.listenLive} stopLabel={t.live.stop} className="btn-live !px-6 !py-3 !text-base" />
              <Link href={L("/programs")} className="btn !border !border-ivory/25 !px-6 !py-3 !text-base text-ivory hover:!border-gold">
                {t.common.explorePrograms}
              </Link>
            </div>
          </div>
          <div className="order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
            <FullLogo
              priority
              className="h-auto w-full"
              style={{
                // Feather only the outer edges so the image blends into the hero without dimming the wordmark.
                maskImage: "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 93%, transparent)",
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
          </div>
        </div>
      </section>
    ),
    now: (
      <section key="now" className="container -mt-8 relative z-10 md:-mt-12">
        <NowNext current={current} upcoming={upcoming} station={station} locale={locale} t={t} signedIn={!!user} reminders={sets.reminders} />
      </section>
    ),
    next: null, // rendered inside "now"
    replays: (
      <section key="replays" className="container mt-16">
        <SectionHeader eyebrow={t.nav.podcasts} title={t.home.latestReplays} href={L("/podcasts")} linkLabel={t.common.seeAll} />
        {episodes.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {episodes.slice(0, 8).map((e) => <EpisodeCard key={e.id} e={e} locale={locale} t={t} />)}
          </div>
        ) : <EmptyState>{t.common.none}</EmptyState>}
      </section>
    ),
    programs: (
      <section key="programs" className="container mt-16">
        <SectionHeader eyebrow={t.nav.programs} title={t.home.featured} href={L("/programs")} linkLabel={t.common.seeAll} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map((p) => <ProgramCard key={p.id} p={p} locale={locale} t={t} />)}
        </div>
      </section>
    ),
    platforms: (
      <section key="platforms" className="container mt-16">
        <SectionHeader title={t.home.everywhere} />
        {platforms.filter((p) => p.kind !== "social").length ? (
          <div className="flex flex-wrap gap-3">
            {platforms.filter((p) => p.kind !== "social").map((p) => (
              <a key={p.key} href={p.url!} target="_blank" rel="noopener noreferrer" className="btn-outline">
                {p.name} <I.External size={14} />
              </a>
            ))}
          </div>
        ) : <EmptyState>{t.home.everywhereEmpty}</EmptyState>}
      </section>
    ),
    presenters: (
      <section key="presenters" className="container mt-16">
        <SectionHeader eyebrow={t.nav.presenters} title={t.home.presenters} href={L("/presenters")} linkLabel={t.common.seeAll} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {presenters.slice(0, 5).map((p) => (
            <Link key={p.id} href={L(`/presenters/${p.slug}`)} className="card flex flex-col items-center gap-3 p-5 text-center hover:shadow-lift">
              <Avatar name={p.display_name} size={72} />
              <div>
                <p className="font-semibold">{p.display_name}</p>
                <p className="text-xs text-muted">{pick(p.title, locale)}</p>
              </div>
              {p.is_sample && <SampleBadge label={t.common.sample} />}
            </Link>
          ))}
        </div>
      </section>
    ),
    news: (
      <section key="news" className="container mt-16">
        <SectionHeader eyebrow={t.nav.news} title={t.home.news} href={L("/news")} linkLabel={t.common.seeAll} />
        {articles.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={L(`/news/${a.slug}`)} className="card flex flex-col gap-2 p-6 hover:shadow-lift">
                <div className="flex items-center gap-2">
                  <span className="eyebrow !text-[10px]">{a.category}</span>
                  {a.is_sample && <SampleBadge label={t.common.sample} />}
                </div>
                <h3 className="text-lg font-semibold">{a.title}</h3>
                <p className="line-clamp-3 text-sm text-muted">{a.excerpt}</p>
                <p className="mt-auto pt-2 text-xs text-muted">{formatDate(a.published_at, locale)}</p>
              </Link>
            ))}
          </div>
        ) : <EmptyState>{t.common.none}</EmptyState>}
      </section>
    ),
    events: (
      <section key="events" className="container mt-16">
        <SectionHeader eyebrow={t.nav.events} title={t.home.events} href={L("/events")} linkLabel={t.common.seeAll} />
        {events.length ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {events.map((e) => (
              <li key={e.id} className="card flex gap-4 p-5">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-navy text-ivory">
                  <span className="text-xs uppercase text-gold">{formatDate(e.starts_at, locale, { month: "short" })}</span>
                  <span className="font-display text-2xl font-bold">{formatDate(e.starts_at, locale, { day: "numeric" })}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{pick(e.title, locale)}</p>
                  <p className="text-xs text-muted">{e.location}</p>
                  {e.is_sample && <div className="mt-2"><SampleBadge label={t.common.sample} /></div>}
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState>{t.common.none}</EmptyState>}
      </section>
    ),
    spiritual: (
      <section key="spiritual" className="container mt-16">
        <SectionHeader eyebrow={t.nav.devotionals} title={t.home.spiritual} href={L("/devotionals")} linkLabel={t.common.seeAll} />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card relative overflow-hidden bg-navy p-7 text-ivory lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{t.home.verse}</p>
            {devotional ? (
              <>
                {devotional.scripture_text && <blockquote className="mt-4 font-display text-xl leading-relaxed md:text-2xl">“{devotional.scripture_text}”</blockquote>}
                <p className="mt-3 text-sm text-gold">{devotional.scripture_ref}{devotional.translation && <span className="text-ivory/60"> · {devotional.translation}</span>}</p>
                <p className="mt-5 text-sm text-ivory/75">{devotional.body}</p>
              </>
            ) : <p className="mt-4 text-ivory/70">{t.common.none}</p>}
          </div>
          <div className="flex flex-col gap-5">
            <Link href={L("/prayer")} className="card flex items-center justify-between gap-4 p-6 hover:shadow-lift">
              <div>
                <p className="font-semibold">{t.home.prayCta}</p>
                <p className="text-xs text-muted">{t.forms.prayerPrivate}</p>
              </div>
              <I.ChevronRight className="text-accent" />
            </Link>
            <div className="card p-6">
              <p className="mb-3 font-semibold">{t.home.testimonies}</p>
              {testimonies.length ? (
                testimonies.map((x) => (
                  <blockquote key={x.id} className="mb-3 text-sm text-muted">“{x.body.slice(0, 160)}{x.body.length > 160 ? "…" : ""}” — {x.name}</blockquote>
                ))
              ) : (
                <p className="text-sm text-muted">
                  <Link href={L("/testimonies")} className="link">{t.forms.testimonyTitle}</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    ),
    newsletter: (
      <section key="newsletter" className="container mt-16">
        <div className="card grid gap-6 p-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-semibold">{t.home.newsletterTitle}</h2>
            <p className="mt-2 text-sm text-muted">{t.home.newsletterBody}</p>
          </div>
          <NewsletterForm locale={locale} t={t} />
        </div>
      </section>
    ),
    support: (
      <section key="support" className="container mt-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500 to-gold-300 p-8 text-navy md:p-12">
          <h2 className="text-3xl font-bold">{t.home.supportTitle}</h2>
          <p className="mt-2 max-w-xl">{t.home.supportBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={L("/support")} className="btn bg-navy text-ivory hover:bg-navy-500">{t.nav.support}</Link>
            <Link href={L("/support#sponsor")} className="btn border border-navy/30 hover:bg-navy/10">{t.support.sponsorTitle}</Link>
          </div>
        </div>
      </section>
    ),
  };

  const order = layout.sections.length ? layout.sections : Object.keys(sections);
  return <>{order.map((k) => sections[k] ?? null)}</>;
}
