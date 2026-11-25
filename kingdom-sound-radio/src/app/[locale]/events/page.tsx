import type { Metadata } from "next";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { formatDate } from "@/lib/i18n";
import { intlTags, pick } from "@/lib/i18n/config";
import { getStation, upcomingEvents } from "@/modules/content";
import { EmptyState, PageHeader, SampleBadge } from "@/components/ui/blocks";
import { EventRegistrationForm } from "@/components/forms/public-forms";
import { LocalTime } from "@/components/ui/local-time";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/events", t.pages.eventsTitle);
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const [events, station] = await Promise.all([upcomingEvents(30), getStation()]);
  return (
    <>
      <PageHeader eyebrow={t.nav.events} title={t.pages.eventsTitle} />
      <div className="container space-y-6 py-10">
        {events.length ? events.map((e) => {
          const full = e.capacity !== null && e.registered >= e.capacity;
          return (
            <article key={e.id} id={e.slug} className="card grid gap-6 p-6 md:grid-cols-[120px_1fr_minmax(0,380px)]">
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl bg-navy text-ivory">
                <span className="text-sm uppercase text-gold">{formatDate(e.starts_at, locale, { month: "short" })}</span>
                <span className="font-display text-4xl font-bold">{formatDate(e.starts_at, locale, { day: "numeric" })}</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="eyebrow !text-[10px]">{e.kind}</span>
                  {e.is_sample && <SampleBadge label={t.common.sample} />}
                </div>
                <h2 className="mt-1 text-xl font-semibold">{pick(e.title, locale)}</h2>
                <p className="mt-1 text-sm text-muted">
                  <LocalTime iso={e.starts_at.toISOString()} stationTz={station.timezone} intl={intlTags[locale]} options={{ weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }} showZone /> · {e.location}
                </p>
                <p className="mt-3 text-sm">{pick(e.description, locale)}</p>
              </div>
              <div>
                {e.registration_enabled && !full && <EventRegistrationForm locale={locale} t={t} eventId={e.id} />}
                {e.registration_enabled && full && <p className="text-sm text-muted">Registration is full.</p>}
              </div>
            </article>
          );
        }) : <EmptyState>{t.common.none}</EmptyState>}
      </div>
    </>
  );
}
