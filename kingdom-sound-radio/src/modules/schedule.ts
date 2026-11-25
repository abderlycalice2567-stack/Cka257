import "server-only";
import { sql } from "@/lib/db";
import type { Tr } from "./catalog";

export type Occurrence = {
  id: string;
  starts_at: Date;
  ends_at: Date;
  status: "scheduled" | "cancelled" | "rescheduled" | "aired";
  is_special: boolean;
  is_rebroadcast: boolean;
  note: string | null;
  program_id: string;
  program_slug: string;
  program_title: Tr;
  category_slug: string | null;
  category_name: Tr | null;
  languages: string[];
  presenters: string[];
};

/** Keeps the rolling window of generated occurrences filled (cheap, idempotent). */
export async function ensureOccurrences() {
  const [r] = await sql<{ latest: Date | null }[]>`
    SELECT max(starts_at) AS latest FROM broadcast_occurrences WHERE schedule_id IS NOT NULL`;
  if (!r?.latest || r.latest.getTime() < Date.now() + 10 * 86400000) {
    await sql`SELECT materialize_occurrences(NULL, 21)`;
  }
}

export async function occurrencesBetween(from: Date, to: Date, opts: { includeCancelled?: boolean; programId?: string } = {}) {
  return sql<Occurrence[]>`
    SELECT o.id, o.starts_at, o.ends_at, o.status, o.is_special, o.is_rebroadcast, o.note,
           p.id AS program_id, p.slug AS program_slug, p.title AS program_title, p.languages,
           c.slug AS category_slug, c.name AS category_name,
           coalesce((SELECT array_agg(pr.display_name ORDER BY pp.sort) FROM program_presenters pp
                      JOIN presenters pr ON pr.id = pp.presenter_id WHERE pp.program_id = p.id), '{}') AS presenters
      FROM broadcast_occurrences o
      JOIN programs p ON p.id = o.program_id AND p.status = 'published'
      LEFT JOIN categories c ON c.id = p.category_id
     WHERE o.ends_at > ${from} AND o.starts_at < ${to}
       ${opts.includeCancelled ? sql`` : sql`AND o.status <> 'cancelled'`}
       ${opts.programId ? sql`AND o.program_id = ${opts.programId}` : sql``}
     ORDER BY o.starts_at`;
}

export async function onAirAndNext(now = new Date()) {
  await ensureOccurrences();
  const window = await occurrencesBetween(new Date(now.getTime() - 6 * 3600000), new Date(now.getTime() + 2 * 86400000));
  const current = window.find((o) => o.starts_at <= now && o.ends_at > now) ?? null;
  const upcoming = window.filter((o) => o.starts_at > now).slice(0, 5);
  return { current, upcoming };
}

export async function nextAiring(programId: string) {
  const rows = await sql<{ starts_at: Date; ends_at: Date }[]>`
    SELECT starts_at, ends_at FROM broadcast_occurrences
     WHERE program_id = ${programId} AND starts_at > now() AND status <> 'cancelled'
     ORDER BY starts_at LIMIT 1`;
  return rows[0] ?? null;
}

export async function programRules(programId: string) {
  return sql<{ weekdays: number[]; start_time: string; duration_minutes: number; is_rebroadcast: boolean }[]>`
    SELECT weekdays, to_char(start_time, 'HH24:MI') AS start_time, duration_minutes, is_rebroadcast
      FROM broadcast_schedules WHERE program_id = ${programId} AND active ORDER BY start_time`;
}
