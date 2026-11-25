import "server-only";
import { sql } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

export type Tr = Partial<Record<Locale, string>>;

export type Category = { id: string; slug: string; name: Tr };
export type PresenterRow = {
  id: string;
  slug: string;
  display_name: string;
  title: Tr;
  bio: Tr;
  photo_key: string | null;
  is_sample: boolean;
};
export type ProgramRow = {
  id: string;
  slug: string;
  title: Tr;
  summary: Tr;
  description: Tr;
  languages: string[];
  featured: boolean;
  status: string;
  podcast_enabled: boolean;
  external_links: Record<string, string>;
  is_sample: boolean;
  category_slug: string | null;
  category_name: Tr | null;
  cover_key: string | null;
  presenters: { slug: string; display_name: string }[];
};
export type EpisodeRow = {
  id: string;
  slug: string;
  number: number | null;
  title: string;
  description: string;
  language: string;
  status: string;
  published_at: Date | null;
  original_air_date: Date | null;
  duration_seconds: number | null;
  scripture_refs: string[];
  topics: string[];
  downloadable: boolean;
  is_sample: boolean;
  transcript: string | null;
  audio_key: string | null;
  audio_mime: string | null;
  audio_bytes: number | null;
  program_slug: string;
  program_title: Tr;
  program_cover_key: string | null;
  category_slug: string | null;
};

export const mediaUrl = (key: string | null | undefined) => (key ? `/media/${key}` : null);

export async function listCategories() {
  return sql<Category[]>`SELECT id, slug, name FROM categories ORDER BY sort, slug`;
}

const programSelect = () => sql`
  SELECT p.id, p.slug, p.title, p.summary, p.description, p.languages, p.featured, p.status,
         p.podcast_enabled, p.external_links, p.is_sample,
         c.slug AS category_slug, c.name AS category_name, ma.storage_key AS cover_key,
         coalesce((SELECT json_agg(json_build_object('slug', pr.slug, 'display_name', pr.display_name) ORDER BY pp.sort)
                     FROM program_presenters pp JOIN presenters pr ON pr.id = pp.presenter_id AND pr.published
                    WHERE pp.program_id = p.id), '[]') AS presenters
    FROM programs p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN media_assets ma ON ma.id = p.cover_asset_id`;

export async function listPrograms(opts: { category?: string; language?: string; featured?: boolean } = {}) {
  return sql<ProgramRow[]>`${programSelect()}
    WHERE p.status = 'published'
      ${opts.category ? sql`AND c.slug = ${opts.category}` : sql``}
      ${opts.language ? sql`AND ${opts.language} = ANY(p.languages)` : sql``}
      ${opts.featured ? sql`AND p.featured` : sql``}
    ORDER BY p.featured DESC, p.title->>'en'`;
}

export async function getProgram(slug: string) {
  const rows = await sql<ProgramRow[]>`${programSelect()} WHERE p.slug = ${slug} AND p.status = 'published'`;
  return rows[0] ?? null;
}

export async function listPresenters() {
  return sql<PresenterRow[]>`
    SELECT pr.id, pr.slug, pr.display_name, pr.title, pr.bio, ma.storage_key AS photo_key, pr.is_sample
      FROM presenters pr LEFT JOIN media_assets ma ON ma.id = pr.photo_asset_id
     WHERE pr.published ORDER BY pr.display_name`;
}

export async function getPresenter(slug: string) {
  const rows = await sql<PresenterRow[]>`
    SELECT pr.id, pr.slug, pr.display_name, pr.title, pr.bio, ma.storage_key AS photo_key, pr.is_sample
      FROM presenters pr LEFT JOIN media_assets ma ON ma.id = pr.photo_asset_id
     WHERE pr.slug = ${slug} AND pr.published`;
  return rows[0] ?? null;
}

export async function programsForPresenter(presenterId: string) {
  return sql<ProgramRow[]>`${programSelect()}
    WHERE p.status = 'published' AND EXISTS (SELECT 1 FROM program_presenters pp WHERE pp.program_id = p.id AND pp.presenter_id = ${presenterId})
    ORDER BY p.title->>'en'`;
}

const episodeSelect = () => sql`
  SELECT e.id, e.slug, e.number, e.title, e.description, e.language, e.status, e.published_at,
         e.original_air_date, coalesce(e.duration_seconds, a.duration_seconds) AS duration_seconds,
         e.scripture_refs, e.topics, e.downloadable, e.is_sample, e.transcript,
         a.storage_key AS audio_key, a.mime_type AS audio_mime, a.bytes::int AS audio_bytes,
         p.slug AS program_slug, p.title AS program_title, pc.storage_key AS program_cover_key,
         c.slug AS category_slug
    FROM episodes e
    JOIN programs p ON p.id = e.program_id AND p.status = 'published'
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN media_assets a ON a.id = e.audio_asset_id
    LEFT JOIN media_assets pc ON pc.id = p.cover_asset_id`;

export async function latestEpisodes(limit = 6) {
  return sql<EpisodeRow[]>`${episodeSelect()}
    WHERE e.status = 'published' AND e.published_at <= now()
    ORDER BY e.published_at DESC LIMIT ${limit}`;
}

export async function episodesForProgram(programId: string, limit = 50) {
  return sql<EpisodeRow[]>`${episodeSelect()}
    WHERE e.program_id = ${programId} AND e.status = 'published' AND e.published_at <= now()
    ORDER BY e.published_at DESC LIMIT ${limit}`;
}

export type EpisodeFilters = {
  q?: string;
  program?: string;
  category?: string;
  language?: string;
  presenter?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest" | "relevance";
  page?: number;
  pageSize?: number;
};

export async function searchEpisodes(f: EpisodeFilters) {
  const pageSize = Math.min(Math.max(f.pageSize ?? 12, 1), 50);
  const page = Math.max(f.page ?? 1, 1);
  const q = f.q?.trim().slice(0, 120) || "";
  const tsq = () => sql`websearch_to_tsquery('simple', ${q})`;
  const where = () => sql`
    WHERE e.status = 'published' AND e.published_at <= now()
      ${q ? sql`AND (e.search @@ ${tsq()} OR e.title ILIKE ${"%" + q.replace(/[%_\\]/g, "\\$&") + "%"})` : sql``}
      ${f.program ? sql`AND p.slug = ${f.program}` : sql``}
      ${f.category ? sql`AND c.slug = ${f.category}` : sql``}
      ${f.language ? sql`AND e.language = ${f.language}` : sql``}
      ${f.presenter ? sql`AND EXISTS (SELECT 1 FROM program_presenters pp JOIN presenters pr ON pr.id = pp.presenter_id WHERE pp.program_id = p.id AND pr.slug = ${f.presenter})` : sql``}
      ${f.from ? sql`AND e.published_at >= ${f.from}::date` : sql``}
      ${f.to ? sql`AND e.published_at < (${f.to}::date + 1)` : sql``}`;
  const order = () =>
    f.sort === "oldest"
      ? sql`ORDER BY e.published_at ASC`
      : q && f.sort !== "newest"
        ? sql`ORDER BY ts_rank(e.search, ${tsq()}) DESC, e.published_at DESC`
        : sql`ORDER BY e.published_at DESC`;
  const [items, total] = await Promise.all([
    sql<EpisodeRow[]>`${episodeSelect()} ${where()} ${order()} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
    sql<{ n: number }[]>`SELECT count(*)::int AS n FROM episodes e JOIN programs p ON p.id = e.program_id AND p.status='published' LEFT JOIN categories c ON c.id = p.category_id ${where()}`,
  ]);
  return { items, total: total[0]?.n ?? 0, page, pageSize };
}

export async function getEpisode(programSlug: string, slug: string) {
  const rows = await sql<EpisodeRow[]>`${episodeSelect()}
    WHERE p.slug = ${programSlug} AND e.slug = ${slug} AND e.status = 'published' AND e.published_at <= now()`;
  return rows[0] ?? null;
}

export async function getEpisodeById(id: string) {
  const rows = await sql<EpisodeRow[]>`${episodeSelect()}
    WHERE e.id = ${id} AND e.status = 'published' AND e.published_at <= now()`;
  return rows[0] ?? null;
}

export async function episodeChapters(episodeId: string) {
  return sql<{ start_seconds: number; title: string }[]>`
    SELECT start_seconds, title FROM episode_chapters WHERE episode_id = ${episodeId} ORDER BY start_seconds`;
}

export async function relatedEpisodes(ep: EpisodeRow, limit = 4) {
  return sql<EpisodeRow[]>`${episodeSelect()}
    WHERE e.status = 'published' AND e.published_at <= now() AND e.id <> ${ep.id}
      AND (p.slug = ${ep.program_slug} OR e.topics && ${ep.topics}::text[] OR c.slug = ${ep.category_slug})
    ORDER BY (p.slug = ${ep.program_slug}) DESC, e.published_at DESC LIMIT ${limit}`;
}
