import type { Metadata } from "next";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { intlTags, pick } from "@/lib/i18n/config";
import { ensureOccurrences, occurrencesBetween } from "@/modules/schedule";
import { getStation } from "@/modules/content";
import { listCategories } from "@/modules/catalog";
import { PageHeader } from "@/components/ui/blocks";
import { ScheduleView } from "@/components/site/schedule-view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/schedule", t.pages.scheduleTitle, t.pages.scheduleIntro);
}

/** Window shown on the schedule: from 18 h ago (to catch the current show) to 8 days ahead. */
function scheduleWindow(now = Date.now()) {
  return [new Date(now - 18 * 3600000), new Date(now + 8 * 86400000)] as const;
}

export default async function SchedulePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  await ensureOccurrences();
  const [from, to] = scheduleWindow();
  const [station, occ, cats] = await Promise.all([
    getStation(),
    occurrencesBetween(from, to, { includeCancelled: true }),
    listCategories(),
  ]);
  return (
    <>
      <PageHeader eyebrow={t.nav.schedule} title={t.pages.scheduleTitle} intro={t.pages.scheduleIntro} />
      <div className="container py-10">
        <ScheduleView
          locale={locale}
          intl={intlTags[locale]}
          stationTz={station.timezone}
          categories={cats.map((c) => ({ slug: c.slug, name: pick(c.name, locale) }))}
          slots={occ.map((o) => ({
            id: o.id,
            startsAt: o.starts_at.toISOString(),
            endsAt: o.ends_at.toISOString(),
            status: o.status,
            isSpecial: o.is_special,
            isRebroadcast: o.is_rebroadcast,
            note: o.note,
            programId: o.program_id,
            programSlug: o.program_slug,
            title: pick(o.program_title, locale),
            category: o.category_slug,
            categoryName: o.category_name ? pick(o.category_name, locale) : null,
            languages: o.languages,
            presenters: o.presenters,
          }))}
          labels={{
            today: t.common.today,
            tomorrow: t.common.tomorrow,
            week: t.common.week,
            onAirNow: t.live.onAirNow,
            allCategories: t.common.allCategories,
            allLanguages: t.common.allLanguages,
            yourTime: t.common.yourTime,
            stationTime: t.common.stationTime,
            calendar: t.common.calendar,
            rebroadcast: t.common.rebroadcast,
            special: t.common.special,
            cancelled: t.common.cancelled,
            autodj: t.live.autodj,
            none: t.common.none,
          }}
        />
      </div>
    </>
  );
}
