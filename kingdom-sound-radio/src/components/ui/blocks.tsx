import Link from "next/link";
import type { ReactNode } from "react";
import { ProgramArt } from "./art";
import { PlayEpisodeButton } from "@/components/player/controls";
import { formatDate, formatDuration, type Dictionary } from "@/lib/i18n";
import { pick, type Locale } from "@/lib/i18n/config";
import { mediaUrl, type EpisodeRow, type ProgramRow } from "@/modules/catalog";
import { toEpisodeItem } from "@/lib/episode-item";
import * as I from "@/components/icons";

export function SampleBadge({ label }: { label: string }) {
  return <span className="chip border-gold/50 bg-gold/10 text-[10px] uppercase tracking-wider text-fg">{label}</span>;
}

export function SectionHeader({ eyebrow, title, href, linkLabel, children }: { eyebrow?: string; title: string; href?: string; linkLabel?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
        {children}
      </div>
      {href && linkLabel && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
          {linkLabel} <I.ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-navy text-ivory">
      <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" style={{ background: "radial-gradient(60% 80% at 85% 10%, rgba(212,175,55,.35), transparent 60%)" }} />
      <div className="container relative py-12 md:py-16">
        {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{eyebrow}</p>}
        <h1 className="max-w-3xl text-3xl font-bold md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-base text-ivory/75 md:text-lg">{intro}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

export function ProgramCard({ p, locale, t }: { p: ProgramRow; locale: Locale; t: Dictionary }) {
  const title = pick(p.title, locale);
  return (
    <Link href={`/${locale}/programs/${p.slug}`} className="group card flex flex-col overflow-hidden transition-shadow hover:shadow-lift">
      <ProgramArt seed={p.slug} label={title} src={mediaUrl(p.cover_key)} className="aspect-[16/10] w-full" rounded="rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {p.category_name && <span className="eyebrow !text-[10px]">{pick(p.category_name, locale)}</span>}
          {p.is_sample && <SampleBadge label={t.common.sample} />}
        </div>
        <h3 className="text-lg font-semibold group-hover:text-accent">{title}</h3>
        <p className="line-clamp-2 text-sm text-muted">{pick(p.summary, locale)}</p>
        {p.presenters.length > 0 && (
          <p className="mt-auto pt-2 text-xs text-muted">
            {t.common.by} {p.presenters.map((x) => x.display_name).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}

export function EpisodeCard({ e, locale, t, layout = "card" }: { e: EpisodeRow; locale: Locale; t: Dictionary; layout?: "card" | "row" }) {
  const item = toEpisodeItem(e, locale);
  const href = `/${locale}/programs/${e.program_slug}/${e.slug}`;
  const meta = [
    e.published_at ? formatDate(e.published_at, locale, { dateStyle: "medium" }) : null,
    e.duration_seconds ? formatDuration(e.duration_seconds) : null,
    e.language.toUpperCase(),
  ].filter(Boolean);
  if (layout === "row") {
    return (
      <li className="flex items-center gap-4 py-4">
        <ProgramArt seed={e.program_slug} label={pick(e.program_title, locale)} src={mediaUrl(e.program_cover_key)} className="h-16 w-16 shrink-0" rounded="rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{pick(e.program_title, locale)}</p>
          <Link href={href} className="block truncate font-semibold hover:text-accent">{e.title}</Link>
          <p className="text-xs text-muted">{meta.join(" · ")}</p>
        </div>
        {item && <PlayEpisodeButton episode={item} label={t.common.play} pauseLabel={t.common.pause} compact />}
      </li>
    );
  }
  return (
    <article className="card flex flex-col overflow-hidden">
      <Link href={href} tabIndex={-1} aria-hidden="true">
        <ProgramArt seed={e.program_slug} label={pick(e.program_title, locale)} src={mediaUrl(e.program_cover_key)} className="aspect-square w-full" rounded="rounded-none" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-medium text-accent">{pick(e.program_title, locale)}</p>
          {e.is_sample && <SampleBadge label={t.common.sample} />}
        </div>
        <h3 className="line-clamp-2 font-semibold">
          <Link href={href} className="hover:text-accent">{e.title}</Link>
        </h3>
        <p className="text-xs text-muted">{meta.join(" · ")}</p>
        <div className="mt-auto pt-3">
          {item ? <PlayEpisodeButton episode={item} label={t.common.play} pauseLabel={t.common.pause} className="btn-gold btn-sm" /> : null}
        </div>
      </div>
    </article>
  );
}

export function Pagination({ page, total, pageSize, hrefFor, labels }: { page: number; total: number; pageSize: number; hrefFor: (p: number) => string; labels: { next: string; previous: string } }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      {page > 1 ? <Link className="btn-outline btn-sm" href={hrefFor(page - 1)}>{labels.previous}</Link> : <span />}
      <span className="text-sm text-muted">{page} / {pages}</span>
      {page < pages ? <Link className="btn-outline btn-sm" href={hrefFor(page + 1)}>{labels.next}</Link> : <span />}
    </nav>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">{children}</p>;
}
