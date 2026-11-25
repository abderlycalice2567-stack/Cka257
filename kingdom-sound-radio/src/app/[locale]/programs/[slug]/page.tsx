import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { intlTags, pick, isLocale } from "@/lib/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { episodesForProgram, getProgram, listPrograms, mediaUrl } from "@/modules/catalog";
import { nextAiring, programRules } from "@/modules/schedule";
import { getStation } from "@/modules/content";
import { userSets } from "@/modules/account";
import { ProgramArt } from "@/components/ui/art";
import { EmptyState, EpisodeCard, ProgramCard, SampleBadge } from "@/components/ui/blocks";
import { FollowButton, ReminderButton, ShareButton } from "@/components/site/engagement";
import { LocalTime } from "@/components/ui/local-time";
import * as I from "@/components/icons";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const p = await getProgram(slug);
  if (!p) return {};
  return localizedMeta(locale, `/programs/${slug}`, pick(p.title, locale), pick(p.summary, locale));
}

const WEEKDAYS = (intl: string) => [0, 1, 2, 3, 4, 5, 6].map((d) => new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + d))));

export default async function ProgramPage({ params }: { params: Params }) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) notFound();
  const [user, station, episodes, next, rules, siblings] = await Promise.all([
    getCurrentUser(),
    getStation(),
    episodesForProgram(program.id),
    nextAiring(program.id),
    programRules(program.id),
    program.category_slug ? listPrograms({ category: program.category_slug }) : Promise.resolve([]),
  ]);
  const sets = await userSets(user?.id);
  const title = pick(program.title, locale);
  const days = WEEKDAYS(intlTags[locale]);
  const links = Object.entries(program.external_links || {}).filter(([, v]) => typeof v === "string" && v.startsWith("https://"));

  return (
    <>
      <section className="border-b border-line bg-navy text-ivory">
        <div className="container grid gap-8 py-12 md:grid-cols-[280px_1fr] md:items-center">
          <ProgramArt seed={program.slug} label={title} src={mediaUrl(program.cover_key)} className="aspect-square w-full max-w-[280px]" />
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {program.category_name && <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{pick(program.category_name, locale)}</span>}
              {program.languages.map((l) => <span key={l} className="rounded-full border border-ivory/20 px-2 py-0.5 text-[10px] uppercase">{l}</span>)}
              {program.is_sample && <SampleBadge label={t.common.sample} />}
            </div>
            <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-ivory/75">{pick(program.description, locale)}</p>
            {program.presenters.length > 0 && (
              <p className="mt-4 text-sm text-ivory/80">
                {t.common.hosts}:{" "}
                {program.presenters.map((p, i) => (
                  <span key={p.slug}>
                    {i > 0 && ", "}
                    <Link href={`/${locale}/presenters/${p.slug}`} className="underline decoration-gold/50 underline-offset-4 hover:text-gold">{p.display_name}</Link>
                  </span>
                ))}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2 [&_.btn-outline]:border-ivory/25 [&_.btn-outline]:bg-transparent [&_.btn-outline]:text-ivory">
              <FollowButton targetType="program" targetId={program.id} active={sets.follows.has(program.id)} signedIn={!!user} locale={locale} labels={{ follow: t.common.follow, following: t.common.following, signIn: t.common.follow }} />
              <ReminderButton programId={program.id} active={sets.reminders.has(program.id)} signedIn={!!user} locale={locale} labels={{ remind: t.common.remind, set: t.common.reminderSet, signIn: t.common.remind }} />
              <ShareButton url={`/${locale}/programs/${program.slug}`} title={title} labels={{ share: t.common.share, copied: t.common.copied }} />
              {program.podcast_enabled && (
                <a href={`/feeds/podcasts/${program.slug}.xml`} className="btn-outline btn-sm"><I.Rss size={16} /> {t.common.podcastFeed}</a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t.common.episodes}</h2>
          {episodes.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {episodes.map((e) => <EpisodeCard key={e.id} e={e} locale={locale} t={t} />)}
            </div>
          ) : <EmptyState>{t.common.none}</EmptyState>}
        </section>
        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">{t.common.airs}</h2>
            {rules.length ? (
              <ul className="space-y-2 text-sm">
                {rules.map((r, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{r.weekdays.map((d) => days[d]).join(", ")}</span>
                    <span className="tabular-nums text-muted">{r.start_time} · {r.duration_minutes} {t.common.minutes}{r.is_rebroadcast ? ` · ${t.common.rebroadcast}` : ""}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">{t.common.none}</p>}
            <p className="mt-2 text-xs text-muted">{t.common.stationTime}: {station.timezone}</p>
            {next && (
              <p className="mt-4 rounded-xl bg-gold/10 px-3 py-2 text-sm">
                <span className="font-semibold">{t.common.nextAiring}:</span>{" "}
                <LocalTime iso={next.starts_at.toISOString()} stationTz={station.timezone} intl={intlTags[locale]} options={{ weekday: "long", hour: "numeric", minute: "2-digit" }} showZone />
              </p>
            )}
            <a href={`/api/v1/schedule/ics?program=${program.slug}`} className="btn-outline btn-sm mt-4"><I.Calendar size={16} /> {t.common.calendar}</a>
          </div>
          {links.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">{t.common.listenOn}</h2>
              <div className="flex flex-wrap gap-2">
                {links.map(([k, v]) => <a key={k} href={v} className="btn-outline btn-sm capitalize" target="_blank" rel="noopener noreferrer">{k} <I.External size={12} /></a>)}
              </div>
            </div>
          )}
        </aside>
      </div>

      {siblings.filter((s) => s.id !== program.id).length > 0 && (
        <section className="container">
          <h2 className="mb-4 text-xl font-semibold">{t.home.featured}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.filter((s) => s.id !== program.id).slice(0, 3).map((p) => <ProgramCard key={p.id} p={p} locale={locale} t={t} />)}
          </div>
        </section>
      )}
    </>
  );
}
