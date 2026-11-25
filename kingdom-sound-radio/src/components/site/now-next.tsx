import Link from "next/link";
import { ProgramArt } from "@/components/ui/art";
import { ListenLiveButton } from "@/components/player/controls";
import { LocalTime, Countdown } from "@/components/ui/local-time";
import type { Dictionary } from "@/lib/i18n";
import { intlTags, pick, type Locale } from "@/lib/i18n/config";
import type { Occurrence } from "@/modules/schedule";
import type { Station } from "@/modules/content";
import { ReminderButton } from "@/components/site/engagement";

export function NowNext({
  current,
  upcoming,
  station,
  locale,
  t,
  signedIn,
  reminders,
}: {
  current: Occurrence | null;
  upcoming: Occurrence[];
  station: Station;
  locale: Locale;
  t: Dictionary;
  signedIn: boolean;
  reminders: Set<string>;
}) {
  const intl = intlTags[locale];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <ProgramArt
            seed={current?.program_slug ?? "autodj"}
            label={current ? pick(current.program_title, locale) : "KS"}
            className="h-28 w-28 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-1">{t.live.onAirNow}</p>
            {current ? (
              <>
                <h3 className="text-2xl font-semibold">
                  <Link href={`/${locale}/programs/${current.program_slug}`} className="hover:text-accent">
                    {pick(current.program_title, locale)}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-muted">
                  <LocalTime iso={current.starts_at.toISOString()} stationTz={station.timezone} intl={intl} /> –{" "}
                  <LocalTime iso={current.ends_at.toISOString()} stationTz={station.timezone} intl={intl} />
                  {current.presenters.length > 0 && <> · {t.common.by} {current.presenters.join(", ")}</>}
                  {current.is_rebroadcast && <> · {t.common.rebroadcast}</>}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-semibold">{t.live.autodj}</h3>
                <p className="mt-1 text-sm text-muted">{t.live.autodjNote}</p>
              </>
            )}
            <div className="mt-4">
              <ListenLiveButton label={t.common.listenLive} stopLabel={t.live.stop} />
            </div>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">{t.live.upNext}</p>
          <Link href={`/${locale}/schedule`} className="text-xs font-semibold text-accent hover:underline">{t.common.viewSchedule}</Link>
        </div>
        <ul className="divide-y divide-line">
          {upcoming.slice(0, 4).map((o, i) => (
            <li key={o.id} className="flex items-center gap-3 py-3">
              <div className="w-[4.75rem] shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">
                <LocalTime iso={o.starts_at.toISOString()} stationTz={station.timezone} intl={intl} />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/${locale}/programs/${o.program_slug}`} className="block truncate font-medium hover:text-accent">
                  {pick(o.program_title, locale)}
                </Link>
                <p className="truncate text-xs text-muted">
                  {o.category_name ? pick(o.category_name, locale) : ""}
                  {o.presenters.length ? ` · ${o.presenters.join(", ")}` : ""}
                </p>
              </div>
              {i === 0 ? <Countdown iso={o.starts_at.toISOString()} label="⏱" /> : null}
              <ReminderButton programId={o.program_id} active={reminders.has(o.program_id)} signedIn={signedIn} locale={locale} labels={{ remind: t.common.remind, set: t.common.reminderSet, signIn: t.common.signInToSave }} compact />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{t.common.yourTime}</p>
      </div>
    </div>
  );
}
