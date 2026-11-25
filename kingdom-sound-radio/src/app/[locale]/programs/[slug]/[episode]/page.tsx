import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { localizedMeta, resolveLocale, sp } from "@/lib/page";
import { formatDate, formatDuration } from "@/lib/i18n";
import { pick, isLocale } from "@/lib/i18n/config";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { episodeChapters, getEpisode, mediaUrl, relatedEpisodes } from "@/modules/catalog";
import { userSets } from "@/modules/account";
import { toEpisodeItem } from "@/lib/episode-item";
import { ProgramArt } from "@/components/ui/art";
import { EpisodeCard, SampleBadge } from "@/components/ui/blocks";
import { PlayEpisodeButton } from "@/components/player/controls";
import { FavoriteButton, ShareButton } from "@/components/site/engagement";
import * as I from "@/components/icons";

type Params = Promise<{ locale: string; slug: string; episode: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug, episode } = await params;
  if (!isLocale(locale)) return {};
  const e = await getEpisode(slug, episode);
  if (!e) return {};
  return localizedMeta(locale, `/programs/${slug}/${episode}`, e.title, e.description.slice(0, 160));
}

export default async function EpisodePage({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const { slug, episode: epSlug } = await params;
  const e = await getEpisode(slug, epSlug);
  if (!e) notFound();
  const startAt = Number(sp((await searchParams).t)) || undefined;
  const [chapters, related, user] = await Promise.all([episodeChapters(e.id), relatedEpisodes(e), getCurrentUser()]);
  const sets = await userSets(user?.id);
  const item = toEpisodeItem(e, locale, chapters);
  const programTitle = pick(e.program_title, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: e.title,
    description: e.description,
    datePublished: e.published_at?.toISOString(),
    timeRequired: e.duration_seconds ? `PT${Math.round(e.duration_seconds / 60)}M` : undefined,
    inLanguage: e.language,
    url: `${env.appUrl}/${locale}/programs/${slug}/${epSlug}`,
    partOfSeries: { "@type": "PodcastSeries", name: programTitle, url: `${env.appUrl}/${locale}/programs/${slug}` },
    associatedMedia: item ? { "@type": "MediaObject", contentUrl: `${env.appUrl}${item.audioUrl}` } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="border-b border-line bg-navy text-ivory">
        <div className="container grid gap-8 py-12 md:grid-cols-[240px_1fr] md:items-center">
          <ProgramArt seed={e.program_slug} label={programTitle} src={mediaUrl(e.program_cover_key)} className="aspect-square w-full max-w-[240px]" />
          <div>
            <Link href={`/${locale}/programs/${slug}`} className="text-sm font-semibold text-gold hover:underline">{programTitle}</Link>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">{e.title}</h1>
            <p className="mt-3 text-sm text-ivory/70">
              {[
                e.original_air_date && `${t.common.aired} ${formatDate(e.original_air_date, locale)}`,
                e.published_at && `${t.common.published} ${formatDate(e.published_at, locale)}`,
                e.duration_seconds && formatDuration(e.duration_seconds),
                e.language.toUpperCase(),
              ].filter(Boolean).join(" · ")}
            </p>
            {e.is_sample && <div className="mt-3"><SampleBadge label={t.common.sample} /></div>}
            <div className="mt-6 flex flex-wrap items-center gap-2 [&_.btn-outline]:border-ivory/25 [&_.btn-outline]:bg-transparent [&_.btn-outline]:text-ivory">
              {item ? (
                <PlayEpisodeButton episode={item} label={startAt ? `${t.live.resume} ${formatDuration(startAt)}` : t.common.play} pauseLabel={t.common.pause} queueLabel={t.live.addToQueue} startAt={startAt} />
              ) : null}
              <FavoriteButton episodeId={e.id} active={sets.favorites.has(e.id)} signedIn={!!user} locale={locale} labels={{ save: t.common.save, saved: t.common.saved, signIn: t.common.save }} />
              <ShareButton url={`/${locale}/programs/${slug}/${epSlug}`} title={e.title} labels={{ share: t.common.share, copied: t.common.copied }} />
              {e.downloadable && item && (
                <a href={item.audioUrl} download className="btn-outline btn-sm"><I.Download size={16} /> {t.common.download}</a>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="container grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
        <article className="space-y-8">
          <p className="whitespace-pre-line text-[15px] leading-7">{e.description}</p>
          {chapters.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t.common.chapters}</h2>
              <ol className="card divide-y divide-line">
                {chapters.map((c) => (
                  <li key={c.start_seconds} className="flex justify-between px-4 py-2.5 text-sm">
                    <Link href={`?t=${c.start_seconds}`} className="hover:text-accent">{c.title}</Link>
                    <span className="tabular-nums text-muted">{formatDuration(c.start_seconds) || "0:00"}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {e.transcript && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t.common.transcript}</h2>
              <details className="card p-4 text-sm leading-7">
                <summary className="cursor-pointer font-medium">{t.common.readMore}</summary>
                <p className="mt-3 whitespace-pre-line text-muted">{e.transcript}</p>
              </details>
            </section>
          )}
        </article>
        <aside className="space-y-5">
          {e.scripture_refs.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-2 font-semibold">{t.common.scripture}</h2>
              <ul className="flex flex-wrap gap-2">
                {e.scripture_refs.map((r) => (
                  <li key={r}><Link className="chip hover:border-accent" href={`/${locale}/podcasts?q=${encodeURIComponent(r)}`}>{r}</Link></li>
                ))}
              </ul>
            </div>
          )}
          {e.topics.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-2 font-semibold">Topics</h2>
              <ul className="flex flex-wrap gap-2">
                {e.topics.map((x) => <li key={x}><Link className="chip hover:border-accent" href={`/${locale}/podcasts?q=${encodeURIComponent(x)}`}>#{x}</Link></li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>
      {related.length > 0 && (
        <section className="container">
          <h2 className="mb-4 text-xl font-semibold">{t.common.related}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((r) => <EpisodeCard key={r.id} e={r} locale={locale} t={t} />)}
          </div>
        </section>
      )}
    </>
  );
}
