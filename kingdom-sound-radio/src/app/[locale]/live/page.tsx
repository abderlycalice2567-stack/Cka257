import type { Metadata } from "next";
import Link from "next/link";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { pick } from "@/lib/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { onAirAndNext } from "@/modules/schedule";
import { getStation, getStreams, visiblePlatforms } from "@/modules/content";
import { userSets } from "@/modules/account";
import { NowNext } from "@/components/site/now-next";
import { PageHeader } from "@/components/ui/blocks";
import * as I from "@/components/icons";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/live", t.nav.live, t.home.heroBody);
}

export default async function LivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [station, user, streams, platforms, { current, upcoming }] = await Promise.all([
    getStation(),
    getCurrentUser(),
    getStreams(),
    visiblePlatforms(),
    onAirAndNext(),
  ]);
  const sets = await userSets(user?.id);
  const directories = platforms.filter((p) => p.kind === "live_directory");
  return (
    <>
      <PageHeader eyebrow={t.nav.live} title={pick(station.tagline, locale) || t.meta.tagline} intro={t.home.heroBody} />
      <div className="container -mt-8 relative z-10">
        <NowNext current={current} upcoming={upcoming} station={station} locale={locale} t={t} signedIn={!!user} reminders={sets.reminders} />
      </div>
      <div className="container mt-12 grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-semibold">{t.live.quality}</h2>
          {streams.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {streams.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-2.5">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-muted">{s.bitrate_kbps} kbps · {s.format.toUpperCase()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">{t.live.unconfiguredHelp}</p>
          )}
          <p className="mt-4 text-xs text-muted">{t.live.autodjNote}</p>
        </section>
        <section className="card p-6">
          <h2 className="text-lg font-semibold">{t.home.everywhere}</h2>
          {directories.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {directories.map((p) => (
                <a key={p.key} className="btn-outline btn-sm" href={p.url!} target="_blank" rel="noopener noreferrer">{p.name} <I.External size={12} /></a>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">{t.home.everywhereEmpty}</p>
          )}
          <Link href={`/${locale}/faq`} className="mt-4 inline-block text-sm link">{t.nav.faq}</Link>
        </section>
      </div>
    </>
  );
}
