"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as I from "@/components/icons";

export type SlotDTO = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  isSpecial: boolean;
  isRebroadcast: boolean;
  note: string | null;
  programId: string;
  programSlug: string;
  title: string;
  category: string | null;
  categoryName: string | null;
  languages: string[];
  presenters: string[];
};

type Labels = {
  today: string;
  tomorrow: string;
  week: string;
  onAirNow: string;
  allCategories: string;
  allLanguages: string;
  yourTime: string;
  stationTime: string;
  calendar: string;
  rebroadcast: string;
  special: string;
  cancelled: string;
  autodj: string;
  none: string;
};

function dayKey(d: Date, tz?: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function ScheduleView({
  slots,
  intl,
  locale,
  stationTz,
  labels,
  categories,
}: {
  slots: SlotDTO[];
  intl: string;
  locale: string;
  stationTz: string;
  labels: Labels;
  categories: { slug: string; name: string }[];
}) {
  // Until hydration we render in station time so server and client markup match.
  const [tz, setTz] = useState<string | undefined>(stationTz);
  const [now, setNow] = useState<number>(() => new Date(slots[0]?.startsAt ?? Date.now()).getTime());
  const [view, setView] = useState<"today" | "tomorrow" | "week">("today");
  const [cat, setCat] = useState("");
  const [lang, setLang] = useState("");

  useEffect(() => {
    // Switch to the listener's own zone once hydrated (server markup used station time).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTz(undefined);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const zoneName = useMemo(() => {
    const parts = new Intl.DateTimeFormat(intl, { timeZone: tz, timeZoneName: "long" }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  }, [intl, tz]);

  const time = (iso: string) => new Intl.DateTimeFormat(intl, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  const dayLabel = (d: Date) => new Intl.DateTimeFormat(intl, { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(d);

  const todayKey = dayKey(new Date(now), tz);
  const tomorrowKey = dayKey(new Date(now + 86400000), tz);

  const filtered = slots.filter((s) => (!cat || s.category === cat) && (!lang || s.languages.includes(lang)));
  const groups = new Map<string, SlotDTO[]>();
  for (const s of filtered) {
    const k = dayKey(new Date(s.startsAt), tz);
    if (view === "today" && k !== todayKey) continue;
    if (view === "tomorrow" && k !== tomorrowKey) continue;
    if (k < todayKey) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }

  const tab = (v: typeof view, label: string) => (
    <button type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`rounded-full px-4 py-2 text-sm font-semibold ${view === v ? "bg-navy text-ivory dark:bg-gold dark:text-navy" : "text-muted hover:text-fg"}`}>
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="inline-flex rounded-full border border-line bg-surface p-1">
          {tab("today", labels.today)}
          {tab("tomorrow", labels.tomorrow)}
          {tab("week", labels.week)}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="sch-cat">{labels.allCategories}</label>
          <select id="sch-cat" className="input !w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">{labels.allCategories}</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <label className="sr-only" htmlFor="sch-lang">{labels.allLanguages}</label>
          <select id="sch-lang" className="input !w-auto" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="">{labels.allLanguages}</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ht">Kreyòl</option>
          </select>
          <a href={`/api/v1/schedule/ics${cat ? `?category=${cat}` : ""}`} className="btn-outline">
            <I.Calendar size={16} /> {labels.calendar}
          </a>
        </div>
      </div>
      <p className="mb-6 text-xs text-muted">
        {tz ? `${labels.stationTime}: ${stationTz}` : `${labels.yourTime} — ${zoneName}`}
      </p>

      {groups.size === 0 && <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">{labels.none}</p>}
      <div className="space-y-10">
        {[...groups.entries()].map(([k, items]) => (
          <section key={k} aria-labelledby={`day-${k}`}>
            <h2 id={`day-${k}`} className="mb-3 text-lg font-semibold capitalize">
              {k === todayKey ? labels.today : k === tomorrowKey ? labels.tomorrow : dayLabel(new Date(items[0]!.startsAt))}
              {(k === todayKey || k === tomorrowKey) && <span className="ml-2 text-sm font-normal text-muted">{dayLabel(new Date(items[0]!.startsAt))}</span>}
            </h2>
            <ol className="card divide-y divide-line overflow-hidden">
              {items.map((s, idx) => {
                const start = new Date(s.startsAt).getTime();
                const end = new Date(s.endsAt).getTime();
                const onAir = start <= now && end > now && s.status !== "cancelled";
                const prevEnd = idx > 0 ? new Date(items[idx - 1]!.endsAt).getTime() : null;
                const gap = prevEnd !== null && start - prevEnd >= 30 * 60000;
                return (
                  <li key={s.id}>
                    {gap && (
                      <div className="flex items-center gap-4 bg-surface-2/50 px-5 py-2 text-xs text-muted">
                        <span className="w-24 shrink-0 tabular-nums">{time(items[idx - 1]!.endsAt)}</span>
                        <span>{labels.autodj}</span>
                      </div>
                    )}
                    <div className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 ${onAir ? "bg-gold/10" : ""} ${s.status === "cancelled" ? "opacity-60" : ""}`} aria-current={onAir ? "true" : undefined}>
                      <div className="w-24 shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">
                        {time(s.startsAt)}
                        <span className="block text-xs font-normal text-muted">– {time(s.endsAt)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/${locale}/programs/${s.programSlug}`} className={`font-semibold hover:text-accent ${s.status === "cancelled" ? "line-through" : ""}`}>
                            {s.title}
                          </Link>
                          {onAir && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-live px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-white" /> {labels.onAirNow}
                            </span>
                          )}
                          {s.isRebroadcast && <span className="chip">{labels.rebroadcast}</span>}
                          {s.isSpecial && <span className="chip border-gold/50 text-fg">{labels.special}</span>}
                          {s.status === "cancelled" && <span className="chip text-live">{labels.cancelled}</span>}
                        </div>
                        <p className="text-xs text-muted">
                          {[s.categoryName, s.presenters.join(", "), s.languages.map((l) => l.toUpperCase()).join(" / ")].filter(Boolean).join(" · ")}
                        </p>
                        {s.note && <p className="mt-1 text-xs text-muted">{s.note}</p>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
