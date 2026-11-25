import "server-only";
import { sql } from "@/lib/db";
import type { EpisodeRow, ProgramRow, PresenterRow, Tr } from "./catalog";

export async function userSets(userId: string | undefined) {
  if (!userId) return { reminders: new Set<string>(), follows: new Set<string>(), favorites: new Set<string>() };
  const [r, f, fav] = await Promise.all([
    sql<{ program_id: string }[]>`SELECT program_id FROM broadcast_reminders WHERE user_id = ${userId}`,
    sql<{ target_id: string }[]>`SELECT target_id FROM follows WHERE user_id = ${userId}`,
    sql<{ episode_id: string }[]>`SELECT episode_id FROM favorites WHERE user_id = ${userId}`,
  ]);
  return {
    reminders: new Set(r.map((x) => x.program_id)),
    follows: new Set(f.map((x) => x.target_id)),
    favorites: new Set(fav.map((x) => x.episode_id)),
  };
}

const ep = () => sql`
  e.id, e.slug, e.number, e.title, e.description, e.language, e.status, e.published_at, e.original_air_date,
  coalesce(e.duration_seconds, a.duration_seconds) AS duration_seconds, e.scripture_refs, e.topics, e.downloadable,
  e.is_sample, NULL::text AS transcript, a.storage_key AS audio_key, a.mime_type AS audio_mime, a.bytes::int AS audio_bytes,
  p.slug AS program_slug, p.title AS program_title, pc.storage_key AS program_cover_key, NULL::text AS category_slug`;

export async function dashboard(userId: string) {
  const [continueListening, favorites, programs, presenters, history, upcoming, prefs, reminders, donations] = await Promise.all([
    sql<(EpisodeRow & { position_seconds: number })[]>`
      SELECT ${ep()}, pp.position_seconds FROM playback_progress pp
        JOIN episodes e ON e.id = pp.episode_id AND e.status = 'published'
        JOIN programs p ON p.id = e.program_id
        LEFT JOIN media_assets a ON a.id = e.audio_asset_id
        LEFT JOIN media_assets pc ON pc.id = p.cover_asset_id
       WHERE pp.user_id = ${userId} AND NOT pp.completed AND pp.position_seconds > 5
       ORDER BY pp.updated_at DESC LIMIT 6`,
    sql<EpisodeRow[]>`
      SELECT ${ep()} FROM favorites f
        JOIN episodes e ON e.id = f.episode_id AND e.status = 'published'
        JOIN programs p ON p.id = e.program_id
        LEFT JOIN media_assets a ON a.id = e.audio_asset_id
        LEFT JOIN media_assets pc ON pc.id = p.cover_asset_id
       WHERE f.user_id = ${userId} ORDER BY f.created_at DESC LIMIT 24`,
    sql<Pick<ProgramRow, "id" | "slug" | "title">[]>`
      SELECT p.id, p.slug, p.title FROM follows f JOIN programs p ON p.id = f.target_id
       WHERE f.user_id = ${userId} AND f.target_type = 'program' ORDER BY f.created_at DESC`,
    sql<Pick<PresenterRow, "id" | "slug" | "display_name">[]>`
      SELECT pr.id, pr.slug, pr.display_name FROM follows f JOIN presenters pr ON pr.id = f.target_id
       WHERE f.user_id = ${userId} AND f.target_type = 'presenter' ORDER BY f.created_at DESC`,
    sql<{ kind: string; started_at: Date; title: string | null; program_slug: string | null; slug: string | null; program_title: Tr | null }[]>`
      SELECT h.kind, h.started_at, e.title, p.slug AS program_slug, e.slug, p.title AS program_title
        FROM listening_history h LEFT JOIN episodes e ON e.id = h.episode_id LEFT JOIN programs p ON p.id = e.program_id
       WHERE h.user_id = ${userId} ORDER BY h.started_at DESC LIMIT 20`,
    sql<{ starts_at: Date; program_slug: string; program_title: Tr }[]>`
      SELECT o.starts_at, p.slug AS program_slug, p.title AS program_title FROM broadcast_occurrences o
        JOIN programs p ON p.id = o.program_id
       WHERE o.starts_at > now() AND o.starts_at < now() + interval '7 days' AND o.status <> 'cancelled'
         AND (o.program_id IN (SELECT target_id FROM follows WHERE user_id = ${userId} AND target_type = 'program')
           OR o.program_id IN (SELECT program_id FROM broadcast_reminders WHERE user_id = ${userId}))
       ORDER BY o.starts_at LIMIT 8`,
    sql<{ email_program_updates: boolean; email_reminders: boolean; email_marketing: boolean }[]>`
      SELECT email_program_updates, email_reminders, email_marketing FROM notification_preferences WHERE user_id = ${userId}`,
    sql<{ id: string; slug: string; title: Tr }[]>`
      SELECT p.id, p.slug, p.title FROM broadcast_reminders r JOIN programs p ON p.id = r.program_id WHERE r.user_id = ${userId}`,
    sql<{ amount_cents: number; currency: string; recurring: boolean; status: string; created_at: Date }[]>`
      SELECT amount_cents::int, currency, recurring, status, created_at FROM donations WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`,
  ]);
  return {
    continueListening,
    favorites,
    programs,
    presenters,
    history,
    upcoming,
    prefs: prefs[0] ?? { email_program_updates: true, email_reminders: true, email_marketing: false },
    reminders,
    donations,
  };
}

/** Everything we hold about a subscriber, for the data-export right. */
export async function exportUserData(userId: string) {
  const [user, prefs, favorites, follows, progress, history, reminders, prayers, testimonies, donations, consents, registrations] = await Promise.all([
    sql`SELECT email, display_name, locale, email_verified_at, created_at FROM users WHERE id = ${userId}`,
    sql`SELECT email_program_updates, email_reminders, email_marketing FROM notification_preferences WHERE user_id = ${userId}`,
    sql`SELECT e.title, f.created_at FROM favorites f JOIN episodes e ON e.id = f.episode_id WHERE f.user_id = ${userId}`,
    sql`SELECT target_type, target_id, created_at FROM follows WHERE user_id = ${userId}`,
    sql`SELECT e.title, pp.position_seconds, pp.completed, pp.updated_at FROM playback_progress pp JOIN episodes e ON e.id = pp.episode_id WHERE pp.user_id = ${userId}`,
    sql`SELECT kind, episode_id, started_at FROM listening_history WHERE user_id = ${userId} ORDER BY started_at DESC`,
    sql`SELECT p.slug, r.created_at FROM broadcast_reminders r JOIN programs p ON p.id = r.program_id WHERE r.user_id = ${userId}`,
    sql`SELECT body, visibility, status, created_at FROM prayer_requests WHERE user_id = ${userId}`,
    sql`SELECT body, consent_publish, status, created_at FROM testimonies WHERE user_id = ${userId}`,
    sql`SELECT amount_cents, currency, recurring, status, created_at FROM donations WHERE user_id = ${userId}`,
    sql`SELECT kind, granted, source, created_at FROM consent_records WHERE user_id = ${userId}`,
    sql`SELECT e.slug, r.created_at FROM event_registrations r JOIN events e ON e.id = r.event_id WHERE r.user_id = ${userId}`,
  ]);
  return { exportedAt: new Date().toISOString(), user: user[0], preferences: prefs[0] ?? null, favorites, follows, playbackProgress: progress, listeningHistory: history, reminders, prayerRequests: prayers, testimonies, donations, consents, eventRegistrations: registrations };
}
