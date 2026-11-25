import "server-only";
import { sql } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";
import type { Tr } from "./catalog";

export type Station = { id: string; name: string; tagline: Tr; timezone: string; contact_email: string | null };
export type Stream = { id: string; label: string; url: string; bitrate_kbps: number; format: string; is_default: boolean };
export type Platform = { key: string; name: string; kind: string; url: string | null; identifier: string | null };

export async function getStation(): Promise<Station> {
  const rows = await sql<Station[]>`SELECT id, name, tagline, timezone, contact_email FROM stations ORDER BY created_at LIMIT 1`;
  return rows[0] ?? { id: "", name: "The Kingdom Sound Radio", tagline: {}, timezone: "America/New_York", contact_email: null };
}

export async function getStreams() {
  return sql<Stream[]>`SELECT id, label, url, bitrate_kbps, format, is_default FROM stream_endpoints
                        WHERE enabled ORDER BY is_default DESC, sort, bitrate_kbps DESC`;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const rows = await sql<{ value: T }[]>`SELECT value FROM site_settings WHERE key = ${key}`;
  return rows[0]?.value ?? fallback;
}

/** Only integrations that staff enabled AND verified are shown publicly. */
export async function visiblePlatforms() {
  return sql<Platform[]>`SELECT key, name, kind, url, identifier FROM platform_integrations
                          WHERE enabled AND verified_at IS NOT NULL AND url IS NOT NULL ORDER BY sort`;
}

export type Article = { id: string; slug: string; locale: string; title: string; excerpt: string; body: string; category: string; published_at: Date; is_sample: boolean };

export async function listArticles(locale: Locale, limit = 20) {
  return sql<Article[]>`SELECT id, slug, locale, title, excerpt, body, category, published_at, is_sample FROM articles
    WHERE status = 'published' AND published_at <= now() AND locale = ${locale}
    ORDER BY published_at DESC LIMIT ${limit}`;
}

export async function getArticle(locale: Locale, slug: string) {
  const rows = await sql<Article[]>`SELECT id, slug, locale, title, excerpt, body, category, published_at, is_sample FROM articles
    WHERE status = 'published' AND published_at <= now() AND locale = ${locale} AND slug = ${slug}`;
  return rows[0] ?? null;
}

export type Devotional = { day: string; locale: string; title: string; scripture_ref: string; scripture_text: string; translation: string; body: string; is_sample: boolean };

export async function devotionalFor(locale: Locale, tz: string) {
  const rows = await sql<Devotional[]>`
    SELECT to_char(day, 'YYYY-MM-DD') AS day, locale, title, scripture_ref, scripture_text, translation, body, is_sample
      FROM devotionals
     WHERE status = 'published' AND locale IN (${locale}, 'en') AND day <= (now() AT TIME ZONE ${tz})::date
     ORDER BY day DESC, (locale = ${locale}) DESC LIMIT 1`;
  return rows[0] ?? null;
}

export async function recentDevotionals(locale: Locale, tz: string, limit = 14) {
  return sql<Devotional[]>`
    SELECT to_char(day, 'YYYY-MM-DD') AS day, locale, title, scripture_ref, scripture_text, translation, body, is_sample
      FROM devotionals WHERE status = 'published' AND locale = ${locale} AND day <= (now() AT TIME ZONE ${tz})::date
     ORDER BY day DESC LIMIT ${limit}`;
}

export type EventRow = { id: string; slug: string; title: Tr; description: Tr; kind: string; starts_at: Date; ends_at: Date | null; location: string; registration_enabled: boolean; capacity: number | null; registered: number; is_sample: boolean };

export async function upcomingEvents(limit = 10) {
  return sql<EventRow[]>`SELECT e.id, e.slug, e.title, e.description, e.kind, e.starts_at, e.ends_at, e.location,
      e.registration_enabled, e.capacity, e.is_sample,
      (SELECT count(*)::int FROM event_registrations r WHERE r.event_id = e.id) AS registered
    FROM events e WHERE e.status = 'published' AND coalesce(e.ends_at, e.starts_at) > now()
    ORDER BY e.starts_at LIMIT ${limit}`;
}

export async function getPage(slug: string, locale: Locale) {
  const rows = await sql<{ title: string; body: string; is_sample: boolean; locale: string }[]>`
    SELECT title, body, is_sample, locale FROM pages WHERE slug = ${slug} AND locale IN (${locale}, 'en')
    ORDER BY (locale = ${locale}) DESC LIMIT 1`;
  return rows[0] ?? null;
}

export async function featuredTestimonies(limit = 3) {
  return sql<{ id: string; name: string; body: string; published_at: Date }[]>`
    SELECT id, split_part(name, ' ', 1) AS name, body, published_at FROM testimonies
     WHERE status = 'approved' AND consent_publish ORDER BY featured DESC, published_at DESC LIMIT ${limit}`;
}

export async function publicPrayerWall(limit = 6) {
  return sql<{ id: string; name: string | null; body: string; created_at: Date }[]>`
    SELECT id, CASE WHEN visibility = 'public_named' THEN split_part(name, ' ', 1) END AS name, body, created_at
      FROM prayer_requests WHERE status IN ('approved','answered') AND visibility <> 'private'
     ORDER BY created_at DESC LIMIT ${limit}`;
}

export async function activeCampaigns() {
  return sql<{ id: string; slug: string; title: Tr; goal_cents: number | null; raised_cents: number; is_sample: boolean }[]>`
    SELECT c.id, c.slug, c.title, c.goal_cents, c.is_sample,
           coalesce((SELECT sum(amount_cents) FROM donations d WHERE d.campaign_id = c.id AND d.status = 'succeeded'), 0)::int AS raised_cents
      FROM fundraising_campaigns c WHERE c.active ORDER BY c.slug`;
}
