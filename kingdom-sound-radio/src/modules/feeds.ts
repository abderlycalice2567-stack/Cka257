import "server-only";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { buildPodcastRss, type FeedEpisode } from "@/lib/xml";
import { pick } from "@/lib/i18n/config";
import type { Tr } from "./catalog";

type Row = { guid: string; title: string; description: string; slug: string; number: number | null; published_at: Date; duration_seconds: number | null; storage_key: string; mime_type: string; bytes: number; program_slug: string; language: string };

/** Only published, rights-confirmed episodes with audio are ever placed in a feed. */
async function feedItems(programId?: string) {
  return sql<Row[]>`
    SELECT e.guid::text, e.title, e.description, e.slug, e.number, e.published_at,
           coalesce(e.duration_seconds, a.duration_seconds) AS duration_seconds,
           a.storage_key, a.mime_type, a.bytes::int, p.slug AS program_slug, e.language
      FROM episodes e JOIN programs p ON p.id = e.program_id AND p.status = 'published' AND p.podcast_enabled
      JOIN media_assets a ON a.id = e.audio_asset_id
     WHERE e.status = 'published' AND e.rights_confirmed AND e.published_at <= now()
       ${programId ? sql`AND e.program_id = ${programId}` : sql``}
     ORDER BY e.published_at DESC LIMIT 300`;
}

const toItem = (r: Row): FeedEpisode => ({
  guid: r.guid,
  title: r.title,
  description: r.description,
  link: `${env.appUrl}/${r.language}/programs/${r.program_slug}/${r.slug}`,
  audioUrl: `${env.appUrl}/media/${r.storage_key}`,
  audioBytes: r.bytes,
  mimeType: r.mime_type,
  durationSeconds: r.duration_seconds,
  publishedAt: r.published_at,
  number: r.number,
});

export async function programFeed(slug: string) {
  const rows = await sql<{ id: string; slug: string; title: Tr; description: Tr; languages: string[]; podcast_author: string | null; podcast_category: string; podcast_explicit: boolean; cover_key: string | null }[]>`
    SELECT p.id, p.slug, p.title, p.description, p.languages, p.podcast_author, p.podcast_category, p.podcast_explicit, a.storage_key AS cover_key
      FROM programs p LEFT JOIN media_assets a ON a.id = p.cover_asset_id
     WHERE p.slug = ${slug} AND p.status = 'published' AND p.podcast_enabled`;
  const p = rows[0];
  if (!p) return null;
  const lang = (p.languages[0] ?? "en") as "en" | "fr" | "ht";
  return buildPodcastRss(
    {
      title: pick(p.title, lang),
      description: pick(p.description, lang),
      link: `${env.appUrl}/${lang}/programs/${p.slug}`,
      feedUrl: `${env.appUrl}/feeds/podcasts/${p.slug}.xml`,
      language: lang,
      author: p.podcast_author || "The Kingdom Sound Radio",
      category: p.podcast_category,
      explicit: p.podcast_explicit,
      imageUrl: p.cover_key ? `${env.appUrl}/media/${p.cover_key}` : `${env.appUrl}/icon-512.png`,
    },
    (await feedItems(p.id)).map(toItem),
  );
}

export async function networkFeed() {
  return buildPodcastRss(
    {
      title: "The Kingdom Sound Radio",
      description: "Broadcasting Faith. Connecting Communities. Transforming Lives.",
      link: `${env.appUrl}/en/podcasts`,
      feedUrl: `${env.appUrl}/feeds/podcasts.xml`,
      language: "en",
      author: "The Kingdom Sound Radio",
      category: "Religion & Spirituality",
      explicit: false,
      imageUrl: `${env.appUrl}/icon-512.png`,
    },
    (await feedItems()).map(toItem),
  );
}
