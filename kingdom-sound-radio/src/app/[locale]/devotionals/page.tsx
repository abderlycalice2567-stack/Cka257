import type { Metadata } from "next";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { formatDate } from "@/lib/i18n";
import { devotionalFor, getStation, recentDevotionals } from "@/modules/content";
import { EmptyState, PageHeader, SampleBadge } from "@/components/ui/blocks";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/devotionals", t.pages.devotionalsTitle);
}

export default async function DevotionalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const station = await getStation();
  const [today, recent] = await Promise.all([devotionalFor(locale, station.timezone), recentDevotionals(locale, station.timezone)]);
  return (
    <>
      <PageHeader eyebrow={t.nav.devotionals} title={t.pages.devotionalsTitle} />
      <div className="container py-10">
        {today ? (
          <section className="card overflow-hidden">
            <div className="bg-navy p-8 text-ivory">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{t.home.devotional} · {formatDate(today.day + "T12:00:00Z", locale)}</p>
              <h2 className="mt-3 text-2xl font-semibold">{today.title}</h2>
              {today.scripture_text && <blockquote className="mt-5 font-display text-xl leading-relaxed md:text-2xl">“{today.scripture_text}”</blockquote>}
              <p className="mt-3 text-sm text-gold">{today.scripture_ref}{today.translation && <span className="text-ivory/60"> · {today.translation}</span>}</p>
            </div>
            <div className="p-8">
              <p className="whitespace-pre-line leading-7">{today.body}</p>
              {today.is_sample && <div className="mt-4"><SampleBadge label={t.common.sample} /></div>}
            </div>
          </section>
        ) : <EmptyState>{t.common.none}</EmptyState>}
        {recent.length > 1 && (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {recent.slice(1).map((d) => (
              <li key={d.day} className="card p-5">
                <p className="text-xs text-muted">{formatDate(d.day + "T12:00:00Z", locale)}</p>
                <p className="mt-1 font-semibold">{d.scripture_ref}</p>
                {d.scripture_text && <p className="mt-2 line-clamp-2 text-sm text-muted">“{d.scripture_text}”</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
