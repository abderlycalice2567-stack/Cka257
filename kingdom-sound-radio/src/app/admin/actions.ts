"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { back, bool, int, isCheckViolation, isUniqueViolation, optStr, slugify, SLUG, str, tr, UUID } from "@/lib/admin";
import { clientIp, getCurrentUser, markSessionMfaVerified, requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { decryptSecret, encryptSecret, newTotpSecret, verifyTotp } from "@/lib/auth/totp";
import { probeDuration, removeKey, saveUpload } from "@/lib/media/storage";

const LANGS = ["en", "fr", "ht"];

// ------------------------------------------------------------------ MFA
export async function beginMfaSetup() {
  const u = await getCurrentUser();
  if (!u || !hasPermission(u.permissions, "admin.access")) redirect("/admin/forbidden");
  if (u.totpEnabled) redirect("/admin/mfa");
  await sql`UPDATE users SET totp_secret_enc = ${encryptSecret(newTotpSecret())} WHERE id = ${u.id} AND totp_enabled_at IS NULL`;
  redirect("/admin/mfa/setup?step=scan");
}

export async function confirmMfaSetup(fd: FormData) {
  const u = await getCurrentUser();
  if (!u || !hasPermission(u.permissions, "admin.access")) redirect("/admin/forbidden");
  if (!rateLimit(`mfa:${u.id}`, 6, 5 * 60_000).ok) back("/admin/mfa/setup?step=scan", "error", "Too many attempts — wait a few minutes.");
  const [row] = await sql<{ totp_secret_enc: string | null }[]>`SELECT totp_secret_enc FROM users WHERE id = ${u.id}`;
  if (!row?.totp_secret_enc) redirect("/admin/mfa/setup");
  const step = verifyTotp(decryptSecret(row.totp_secret_enc), str(fd, "code", 6));
  if (step === null) back("/admin/mfa/setup?step=scan", "error", "That code didn't match. Check the time on your phone and try again.");
  await sql`UPDATE users SET totp_enabled_at = now(), totp_last_step = ${step} WHERE id = ${u.id}`;
  await markSessionMfaVerified(u.sessionId);
  await audit(u.id, "auth.mfa_enrolled", "user", u.id);
  redirect("/admin");
}

export async function verifyMfa(fd: FormData) {
  const u = await getCurrentUser();
  if (!u || !hasPermission(u.permissions, "admin.access")) redirect("/admin/forbidden");
  if (!rateLimit(`mfa:${u.id}`, 6, 5 * 60_000).ok) back("/admin/mfa", "error", "Too many attempts — wait a few minutes.");
  const [row] = await sql<{ totp_secret_enc: string | null; totp_last_step: string | null }[]>`
    SELECT totp_secret_enc, totp_last_step FROM users WHERE id = ${u.id} AND totp_enabled_at IS NOT NULL`;
  if (!row?.totp_secret_enc) redirect("/admin/mfa/setup");
  const step = verifyTotp(decryptSecret(row.totp_secret_enc), str(fd, "code", 6), Date.now(), row.totp_last_step ? Number(row.totp_last_step) : null);
  if (step === null) {
    await audit(u.id, "auth.mfa_failed", "user", u.id, { ip: await clientIp() });
    back("/admin/mfa", "error", "Invalid or already-used code.");
  }
  await sql`UPDATE users SET totp_last_step = ${step} WHERE id = ${u.id}`;
  await markSessionMfaVerified(u.sessionId);
  await audit(u.id, "auth.mfa_verified", "user", u.id);
  redirect("/admin");
}

// ------------------------------------------------------------------ station
export async function saveStation(fd: FormData) {
  const u = await requirePermission("station.manage");
  const tz = str(fd, "timezone", 64);
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    back("/admin/station", "error", "Unknown time zone");
  }
  const email = optStr(fd, "contact_email", 254);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back("/admin/station", "error", "Invalid contact email");
  await sql`UPDATE stations SET name = ${str(fd, "name", 120) || "The Kingdom Sound Radio"}, timezone = ${tz},
            contact_email = ${email}, tagline = ${sql.json(tr(fd, "tagline", 200))}, updated_at = now()`;
  await sql`SELECT materialize_occurrences(NULL, 21)`;
  await audit(u.id, "station.update", "station", null, { timezone: tz });
  revalidatePath("/", "layout");
  back("/admin/station", "ok", "Station settings saved");
}

export async function addStream(fd: FormData) {
  const u = await requirePermission("station.manage");
  const url = str(fd, "url", 500);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    back("/admin/station", "error", "Enter a valid stream URL");
  }
  if (parsed.protocol !== "https:") back("/admin/station", "error", "Stream URLs must use HTTPS");
  const bitrate = int(fd, "bitrate_kbps") ?? 128;
  const [station] = await sql<{ id: string }[]>`SELECT id FROM stations ORDER BY created_at LIMIT 1`;
  const isFirst = (await sql`SELECT 1 FROM stream_endpoints LIMIT 1`).length === 0;
  try {
    await sql`INSERT INTO stream_endpoints (station_id, label, url, bitrate_kbps, format, is_default)
              VALUES (${station!.id}, ${str(fd, "label", 60) || `${bitrate} kbps`}, ${parsed.toString()}, ${bitrate}, ${str(fd, "format", 10) || "mp3"}, ${isFirst})`;
  } catch (e) {
    if (isCheckViolation(e)) back("/admin/station", "error", "Bitrate must be between 16 and 512 kbps");
    throw e;
  }
  await audit(u.id, "stream.add", "stream", null, { host: parsed.host, bitrate });
  revalidatePath("/", "layout");
  back("/admin/station", "ok", "Stream added. Use \"Listen live\" on the site to test it.");
}

export async function updateStream(fd: FormData) {
  const u = await requirePermission("station.manage");
  const id = str(fd, "id");
  if (!UUID.test(id)) back("/admin/station", "error", "Unknown stream");
  const op = str(fd, "op");
  if (op === "delete") await sql`DELETE FROM stream_endpoints WHERE id = ${id}`;
  if (op === "toggle") await sql`UPDATE stream_endpoints SET enabled = NOT enabled WHERE id = ${id}`;
  if (op === "default") {
    await sql.begin(async (tx) => {
      await tx`UPDATE stream_endpoints SET is_default = false`;
      await tx`UPDATE stream_endpoints SET is_default = true WHERE id = ${id}`;
    });
  }
  await audit(u.id, `stream.${op}`, "stream", id);
  revalidatePath("/", "layout");
  back("/admin/station", "ok", "Stream updated");
}

export async function saveNowPlaying(fd: FormData) {
  const u = await requirePermission("station.manage");
  const provider = str(fd, "provider") === "azuracast" ? "azuracast" : "none";
  const baseUrl = str(fd, "baseUrl", 300).replace(/\/$/, "");
  if (provider === "azuracast" && !/^https:\/\/[^\s/]+/.test(baseUrl)) back("/admin/station", "error", "AzuraCast URL must start with https://");
  const shortcode = str(fd, "stationShortcode", 80);
  if (provider === "azuracast" && !/^[a-z0-9_-]+$/i.test(shortcode)) back("/admin/station", "error", "Enter the AzuraCast station short name");
  await sql`INSERT INTO site_settings (key, value, updated_by) VALUES ('now_playing', ${sql.json({ provider, baseUrl, stationShortcode: shortcode })}, ${u.id})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`;
  await audit(u.id, "station.now_playing", "setting", "now_playing", { provider });
  back("/admin/station", "ok", "Broadcasting engine connection saved");
}

export async function saveHomepage(fd: FormData) {
  const u = await requirePermission("content.manage");
  const allowed = ["hero", "now", "replays", "programs", "platforms", "presenters", "news", "events", "spiritual", "newsletter", "support"];
  const order = str(fd, "sections", 500).split(",").map((s) => s.trim()).filter((s) => allowed.includes(s));
  const enabled = order.filter((s) => bool(fd, `on_${s}`));
  await sql`INSERT INTO site_settings (key, value, updated_by) VALUES ('homepage', ${sql.json({ sections: enabled })}, ${u.id})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`;
  await audit(u.id, "homepage.update", "setting", "homepage", { sections: enabled });
  revalidatePath("/", "layout");
  back("/admin/appearance", "ok", "Homepage layout saved");
}

// ------------------------------------------------------------------ categories / programs / presenters
export async function saveCategory(fd: FormData) {
  const u = await requirePermission("programs.manage");
  const name = tr(fd, "name", 80);
  if (!name.en) back("/admin/programs", "error", "Category needs an English name");
  const slug = slugify(str(fd, "slug") || name.en);
  try {
    await sql`INSERT INTO categories (slug, name, sort) VALUES (${slug}, ${sql.json(name)}, ${int(fd, "sort") ?? 100})
              ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort = EXCLUDED.sort`;
  } catch (e) {
    throw e;
  }
  await audit(u.id, "category.save", "category", slug);
  back("/admin/programs", "ok", "Category saved");
}

async function uploadFrom(fd: FormData, field: string, kind: "audio" | "image", userId: string): Promise<string | null> {
  const f = fd.get(field);
  if (!(f instanceof File) || f.size === 0) return null;
  const saved = await saveUpload(f, kind);
  const duration = kind === "audio" ? await probeDuration(saved.key) : null;
  const [a] = await sql<{ id: string }[]>`
    INSERT INTO media_assets (kind, storage_key, mime_type, bytes, duration_seconds, original_name, uploaded_by)
    VALUES (${saved.kind}, ${saved.key}, ${saved.mime}, ${saved.bytes}, ${duration}, ${f.name.slice(0, 200)}, ${userId}) RETURNING id`;
  await audit(userId, "media.upload", "media_asset", a!.id, { kind, bytes: saved.bytes, mime: saved.mime });
  return a!.id;
}

export async function saveProgram(fd: FormData) {
  const u = await requirePermission("programs.manage");
  const id = str(fd, "id");
  const title = tr(fd, "title", 140);
  const path = id ? `/admin/programs/${id}` : "/admin/programs/new";
  if (!title.en) back(path, "error", "An English title is required");
  const slug = str(fd, "slug") ? slugify(str(fd, "slug")) : slugify(title.en);
  if (!SLUG.test(slug)) back(path, "error", "Invalid slug");
  const languages = LANGS.filter((l) => bool(fd, `lang_${l}`));
  const status = ["draft", "published", "archived"].includes(str(fd, "status")) ? str(fd, "status") : "draft";
  const category = str(fd, "category_id");
  const links: Record<string, string> = {};
  for (const k of ["spotify", "apple", "youtube", "amazon", "deezer"]) {
    const v = str(fd, `link_${k}`, 500);
    if (v) {
      if (!v.startsWith("https://")) back(path, "error", `${k} link must start with https://`);
      links[k] = v;
    }
  }
  let coverId: string | null = null;
  try {
    coverId = await uploadFrom(fd, "cover", "image", u.id);
  } catch (e) {
    back(path, "error", e instanceof Error ? e.message : "Upload failed");
  }
  const values = {
    slug,
    title,
    summary: tr(fd, "summary", 300),
    description: tr(fd, "description", 5000),
    category_id: UUID.test(category) ? category : null,
    languages: languages.length ? languages : ["en"],
    featured: bool(fd, "featured"),
    status,
    podcast_enabled: bool(fd, "podcast_enabled"),
    podcast_author: optStr(fd, "podcast_author", 120),
    podcast_explicit: bool(fd, "podcast_explicit"),
    links,
  };
  let programId = id;
  try {
    if (id) {
      if (!UUID.test(id)) back("/admin/programs", "error", "Unknown program");
      await sql`UPDATE programs SET slug = ${values.slug}, title = ${sql.json(values.title)}, summary = ${sql.json(values.summary)},
                description = ${sql.json(values.description)}, category_id = ${values.category_id}, languages = ${values.languages},
                featured = ${values.featured}, status = ${values.status}, podcast_enabled = ${values.podcast_enabled},
                podcast_author = ${values.podcast_author}, podcast_explicit = ${values.podcast_explicit},
                external_links = ${sql.json(values.links)}, cover_asset_id = coalesce(${coverId}, cover_asset_id), updated_at = now()
                WHERE id = ${id}`;
    } else {
      const [r] = await sql<{ id: string }[]>`INSERT INTO programs (slug, title, summary, description, category_id, languages, featured, status,
                podcast_enabled, podcast_author, podcast_explicit, external_links, cover_asset_id)
                VALUES (${values.slug}, ${sql.json(values.title)}, ${sql.json(values.summary)}, ${sql.json(values.description)}, ${values.category_id},
                        ${values.languages}, ${values.featured}, ${values.status}, ${values.podcast_enabled}, ${values.podcast_author},
                        ${values.podcast_explicit}, ${sql.json(values.links)}, ${coverId}) RETURNING id`;
      programId = r!.id;
    }
  } catch (e) {
    if (isUniqueViolation(e)) back(path, "error", "That slug is already used by another program");
    throw e;
  }
  const presenterIds = fd.getAll("presenters").map(String).filter((x) => UUID.test(x));
  await sql.begin(async (tx) => {
    await tx`DELETE FROM program_presenters WHERE program_id = ${programId}`;
    for (const [i, pid] of presenterIds.entries()) {
      await tx`INSERT INTO program_presenters (program_id, presenter_id, sort) VALUES (${programId}, ${pid}, ${i}) ON CONFLICT DO NOTHING`;
    }
  });
  await audit(u.id, id ? "program.update" : "program.create", "program", programId, { slug, status });
  revalidatePath("/", "layout");
  back(`/admin/programs/${programId}`, "ok", "Program saved");
}

export async function savePresenter(fd: FormData) {
  const u = await requirePermission("presenters.manage");
  const id = str(fd, "id");
  const name = str(fd, "display_name", 100);
  const path = id ? `/admin/presenters/${id}` : "/admin/presenters/new";
  if (name.length < 2) back(path, "error", "A display name is required");
  const slug = str(fd, "slug") ? slugify(str(fd, "slug")) : slugify(name);
  let photoId: string | null = null;
  try {
    photoId = await uploadFrom(fd, "photo", "image", u.id);
  } catch (e) {
    back(path, "error", e instanceof Error ? e.message : "Upload failed");
  }
  let pid = id;
  try {
    if (id) {
      if (!UUID.test(id)) back("/admin/presenters", "error", "Unknown presenter");
      await sql`UPDATE presenters SET slug = ${slug}, display_name = ${name}, title = ${sql.json(tr(fd, "title", 120))},
                bio = ${sql.json(tr(fd, "bio", 5000))}, published = ${bool(fd, "published")},
                photo_asset_id = coalesce(${photoId}, photo_asset_id), is_sample = false, updated_at = now() WHERE id = ${id}`;
    } else {
      const [r] = await sql<{ id: string }[]>`INSERT INTO presenters (slug, display_name, title, bio, published, photo_asset_id)
                VALUES (${slug}, ${name}, ${sql.json(tr(fd, "title", 120))}, ${sql.json(tr(fd, "bio", 5000))}, ${bool(fd, "published")}, ${photoId})
                RETURNING id`;
      pid = r!.id;
    }
  } catch (e) {
    if (isUniqueViolation(e)) back(path, "error", "That slug is already in use");
    throw e;
  }
  await audit(u.id, id ? "presenter.update" : "presenter.create", "presenter", pid);
  revalidatePath("/", "layout");
  back(`/admin/presenters/${pid}`, "ok", "Presenter saved");
}

// ------------------------------------------------------------------ schedule
async function findConflict(weekdays: number[], start: string, duration: number, validFrom: string, validUntil: string | null, excludeId: string | null) {
  const rows = await sql<{ title: unknown; starts_at: Date }[]>`
    WITH tz AS (SELECT coalesce((SELECT timezone FROM stations ORDER BY created_at LIMIT 1), 'America/New_York') AS z),
    mine AS (SELECT * FROM schedule_slots(${weekdays}::smallint[], ${start}::time, ${duration}, (SELECT z FROM tz), CURRENT_DATE, 28, ${validFrom}::date, ${validUntil}::date)),
    others AS (
      SELECT s.program_id, sl.starts_at, sl.ends_at FROM broadcast_schedules s,
        LATERAL schedule_slots(s.weekdays, s.start_time, s.duration_minutes, (SELECT z FROM tz), CURRENT_DATE, 28, s.valid_from, s.valid_until) sl
       WHERE s.active AND (${excludeId}::uuid IS NULL OR s.id <> ${excludeId}::uuid)
      UNION ALL
      SELECT o.program_id, o.starts_at, o.ends_at FROM broadcast_occurrences o
       WHERE o.schedule_id IS NULL AND o.status <> 'cancelled' AND o.ends_at > now())
    SELECT p.title, m.starts_at FROM mine m JOIN others x ON m.starts_at < x.ends_at AND x.starts_at < m.ends_at
      JOIN programs p ON p.id = x.program_id ORDER BY m.starts_at LIMIT 1`;
  return rows[0] ?? null;
}

export async function saveSchedule(fd: FormData) {
  const u = await requirePermission("schedule.manage");
  const id = str(fd, "id") || null;
  const programId = str(fd, "program_id");
  const weekdays = [0, 1, 2, 3, 4, 5, 6].filter((d) => bool(fd, `d${d}`));
  const start = str(fd, "start_time", 5);
  const duration = int(fd, "duration_minutes") ?? 60;
  const validFrom = str(fd, "valid_from", 10) || new Date().toISOString().slice(0, 10);
  const validUntil = optStr(fd, "valid_until", 10);
  if (!UUID.test(programId)) back("/admin/schedule", "error", "Choose a program");
  if (!weekdays.length) back("/admin/schedule", "error", "Choose at least one day");
  if (!/^\d{2}:\d{2}$/.test(start)) back("/admin/schedule", "error", "Start time must be HH:MM");
  if (duration < 5 || duration > 1440) back("/admin/schedule", "error", "Duration must be 5–1440 minutes");
  if (id && !UUID.test(id)) back("/admin/schedule", "error", "Unknown schedule");
  if (!bool(fd, "allow_overlap")) {
    const c = await findConflict(weekdays, start, duration, validFrom, validUntil, id);
    if (c) {
      const title = (c.title as { en?: string })?.en ?? "another program";
      back("/admin/schedule", "error", `Conflicts with "${title}" on ${c.starts_at.toISOString().slice(0, 16).replace("T", " ")} UTC. Adjust the time, or tick "allow overlap".`);
    }
  }
  let sid = id;
  if (id) {
    await sql`UPDATE broadcast_schedules SET program_id = ${programId}, weekdays = ${weekdays}, start_time = ${start},
              duration_minutes = ${duration}, valid_from = ${validFrom}, valid_until = ${validUntil},
              is_rebroadcast = ${bool(fd, "is_rebroadcast")}, active = ${bool(fd, "active")}, updated_at = now() WHERE id = ${id}`;
  } else {
    const [r] = await sql<{ id: string }[]>`INSERT INTO broadcast_schedules (program_id, weekdays, start_time, duration_minutes, valid_from, valid_until, is_rebroadcast)
              VALUES (${programId}, ${weekdays}, ${start}, ${duration}, ${validFrom}, ${validUntil}, ${bool(fd, "is_rebroadcast")}) RETURNING id`;
    sid = r!.id;
  }
  await sql`SELECT materialize_occurrences(${sid}::uuid, 21)`;
  await audit(u.id, id ? "schedule.update" : "schedule.create", "schedule", sid, { weekdays, start, duration });
  revalidatePath("/", "layout");
  back("/admin/schedule", "ok", "Schedule saved and upcoming broadcasts regenerated");
}

export async function deleteSchedule(fd: FormData) {
  const u = await requirePermission("schedule.manage");
  const id = str(fd, "id");
  if (!UUID.test(id)) back("/admin/schedule", "error", "Unknown schedule");
  await sql`DELETE FROM broadcast_occurrences WHERE schedule_id = ${id} AND starts_at > now() AND NOT manually_edited`;
  await sql`DELETE FROM broadcast_schedules WHERE id = ${id}`;
  await audit(u.id, "schedule.delete", "schedule", id);
  revalidatePath("/", "layout");
  back("/admin/schedule", "ok", "Schedule removed");
}

export async function updateOccurrence(fd: FormData) {
  const u = await requirePermission("schedule.manage");
  const id = str(fd, "id");
  if (!UUID.test(id)) back("/admin/schedule", "error", "Unknown broadcast");
  const op = str(fd, "op");
  if (op === "cancel") await sql`UPDATE broadcast_occurrences SET status = 'cancelled', manually_edited = true, note = ${optStr(fd, "note", 300)} WHERE id = ${id}`;
  else if (op === "restore") await sql`UPDATE broadcast_occurrences SET status = 'scheduled', manually_edited = true WHERE id = ${id}`;
  else if (op === "move") {
    const local = str(fd, "starts_at", 16);
    const minutes = int(fd, "duration_minutes") ?? 60;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) back("/admin/schedule", "error", "Invalid date/time");
    await sql`UPDATE broadcast_occurrences o SET starts_at = x.t, ends_at = x.t + make_interval(mins => ${minutes}),
              status = 'rescheduled', manually_edited = true, note = ${optStr(fd, "note", 300)}
              FROM (SELECT (${local}::timestamp AT TIME ZONE coalesce((SELECT timezone FROM stations ORDER BY created_at LIMIT 1), 'America/New_York')) AS t) x
              WHERE o.id = ${id}`;
  } else if (op === "episode") {
    const ep = str(fd, "episode_id");
    await sql`UPDATE broadcast_occurrences SET episode_id = ${UUID.test(ep) ? ep : null}, manually_edited = true WHERE id = ${id}`;
  }
  await audit(u.id, `occurrence.${op}`, "occurrence", id);
  revalidatePath("/", "layout");
  back("/admin/schedule", "ok", "Broadcast updated");
}

export async function createSpecial(fd: FormData) {
  const u = await requirePermission("schedule.manage");
  const programId = str(fd, "program_id");
  const local = str(fd, "starts_at", 16); // datetime-local, interpreted in the station's time zone
  const minutes = int(fd, "duration_minutes") ?? 60;
  if (!UUID.test(programId) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) back("/admin/schedule", "error", "Program and start time are required");
  if (minutes < 5 || minutes > 1440) back("/admin/schedule", "error", "Duration must be 5–1440 minutes");
  await sql`INSERT INTO broadcast_occurrences (program_id, starts_at, ends_at, is_special, note, manually_edited)
            SELECT ${programId}, t, t + make_interval(mins => ${minutes}), true, ${optStr(fd, "note", 300)}, true
              FROM (SELECT (${local}::timestamp AT TIME ZONE coalesce((SELECT timezone FROM stations ORDER BY created_at LIMIT 1), 'America/New_York')) AS t) x`;
  await audit(u.id, "occurrence.special", "program", programId);
  revalidatePath("/", "layout");
  back("/admin/schedule", "ok", "Special broadcast added");
}

// ------------------------------------------------------------------ episodes
function parseChapters(text: string) {
  const out: { start: number; title: string }[] = [];
  for (const line of text.split("\n")) {
    const m = /^\s*(?:(\d+):)?(\d{1,2}):(\d{2})\s+(.+)$/.exec(line);
    if (!m) continue;
    out.push({ start: Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]), title: m[4]!.trim().slice(0, 140) });
  }
  return out;
}

export async function saveEpisode(fd: FormData) {
  const u = await requirePermission("episodes.manage");
  const id = str(fd, "id");
  const programId = str(fd, "program_id");
  const title = str(fd, "title", 200);
  const path = id ? `/admin/episodes/${id}` : "/admin/episodes/new";
  if (!UUID.test(programId)) back(path, "error", "Choose a program");
  if (title.length < 2) back(path, "error", "A title is required");
  const slug = str(fd, "slug") ? slugify(str(fd, "slug")) : slugify(title);
  const language = LANGS.includes(str(fd, "language")) ? str(fd, "language") : "en";
  const list = (k: string) => str(fd, k, 1000).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
  let audioId: string | null = null;
  try {
    audioId = await uploadFrom(fd, "audio", "audio", u.id);
  } catch (e) {
    back(path, "error", e instanceof Error ? e.message : "Upload failed");
  }
  const air = str(fd, "original_air_date");
  const values = {
    description: str(fd, "description", 5000),
    transcript: optStr(fd, "transcript", 200000),
    number: int(fd, "number"),
    air: air ? new Date(air) : null,
    scripture: list("scripture_refs"),
    topics: list("topics"),
    downloadable: bool(fd, "downloadable"),
  };
  let eid = id;
  try {
    if (id) {
      if (!UUID.test(id)) back("/admin/episodes", "error", "Unknown episode");
      await sql`UPDATE episodes SET program_id = ${programId}, slug = ${slug}, title = ${title}, description = ${values.description},
                language = ${language}, number = ${values.number}, original_air_date = ${values.air}, transcript = ${values.transcript},
                scripture_refs = ${values.scripture}, topics = ${values.topics}, downloadable = ${values.downloadable},
                audio_asset_id = coalesce(${audioId}, audio_asset_id),
                duration_seconds = coalesce((SELECT duration_seconds FROM media_assets WHERE id = ${audioId}), duration_seconds),
                updated_at = now() WHERE id = ${id}`;
    } else {
      const [r] = await sql<{ id: string }[]>`INSERT INTO episodes (program_id, slug, title, description, language, number, original_air_date,
                transcript, scripture_refs, topics, downloadable, audio_asset_id, duration_seconds, status)
                VALUES (${programId}, ${slug}, ${title}, ${values.description}, ${language}, ${values.number}, ${values.air}, ${values.transcript},
                        ${values.scripture}, ${values.topics}, ${values.downloadable}, ${audioId},
                        (SELECT duration_seconds FROM media_assets WHERE id = ${audioId}), ${audioId ? "awaiting_review" : "draft"})
                RETURNING id`;
      eid = r!.id;
    }
  } catch (e) {
    if (isUniqueViolation(e)) back(path, "error", "That slug already exists in this program");
    throw e;
  }
  const chapters = parseChapters(str(fd, "chapters", 20000));
  await sql.begin(async (tx) => {
    await tx`DELETE FROM episode_chapters WHERE episode_id = ${eid}`;
    for (const c of chapters) await tx`INSERT INTO episode_chapters (episode_id, start_seconds, title) VALUES (${eid}, ${c.start}, ${c.title})`;
  });
  await audit(u.id, id ? "episode.update" : "episode.create", "episode", eid, { audioUploaded: !!audioId });
  revalidatePath("/", "layout");
  back(`/admin/episodes/${eid}`, "ok", audioId ? "Episode saved. Audio uploaded — it stays private until published." : "Episode saved");
}

const TRANSITIONS: Record<string, { to: string[]; publish?: boolean }> = {
  draft: { to: ["scheduled", "processing", "awaiting_review", "archived"] },
  scheduled: { to: ["draft", "recording", "awaiting_review"] },
  recording: { to: ["processing", "failed"] },
  processing: { to: ["awaiting_review", "failed"] },
  failed: { to: ["processing", "draft"] },
  awaiting_review: { to: ["approved", "rejected", "published", "draft"], publish: true },
  approved: { to: ["published", "rejected", "awaiting_review"], publish: true },
  rejected: { to: ["draft"] },
  published: { to: ["archived", "awaiting_review"], publish: true },
  archived: { to: ["draft", "published"], publish: true },
};

export async function setEpisodeStatus(fd: FormData) {
  const u = await requirePermission("episodes.manage");
  const id = str(fd, "id");
  const to = str(fd, "status");
  const path = `/admin/episodes/${id}`;
  if (!UUID.test(id)) back("/admin/episodes", "error", "Unknown episode");
  const [e] = await sql<{ status: string; audio_asset_id: string | null; rights_confirmed: boolean }[]>`
    SELECT status, audio_asset_id, rights_confirmed FROM episodes WHERE id = ${id}`;
  if (!e) back("/admin/episodes", "error", "Unknown episode");
  const rule = TRANSITIONS[e.status];
  if (!rule?.to.includes(to)) back(path, "error", `Cannot move from ${e.status} to ${to}`);
  const needsPublish = ["approved", "published", "rejected"].includes(to) || (rule.publish && to !== "draft");
  if (needsPublish && !hasPermission(u.permissions, "episodes.publish")) back(path, "error", "Only editors can approve, reject or publish");
  const rights = bool(fd, "rights_confirmed") || e.rights_confirmed;
  if (to === "published") {
    if (!e.audio_asset_id) back(path, "error", "Upload audio before publishing");
    if (!rights) back(path, "error", "Confirm the copyright, privacy and publication rights review first");
  }
  await sql`UPDATE episodes SET status = ${to}, rights_confirmed = ${rights},
            published_at = CASE WHEN ${to} = 'published' THEN coalesce(published_at, now()) ELSE published_at END,
            updated_at = now() WHERE id = ${id}`;
  await audit(u.id, "episode.status", "episode", id, { from: e.status, to, rightsConfirmed: rights });
  revalidatePath("/", "layout");
  back(path, "ok", `Status changed to ${to.replace("_", " ")}`);
}

export async function deleteEpisode(fd: FormData) {
  const u = await requirePermission("episodes.publish");
  const id = str(fd, "id");
  if (!UUID.test(id)) back("/admin/episodes", "error", "Unknown episode");
  await sql`DELETE FROM episodes WHERE id = ${id}`;
  await audit(u.id, "episode.delete", "episode", id);
  revalidatePath("/", "layout");
  back("/admin/episodes", "ok", "Episode deleted");
}

// ------------------------------------------------------------------ content
export async function saveArticle(fd: FormData) {
  const u = await requirePermission("content.manage");
  const id = str(fd, "id");
  const title = str(fd, "title", 200);
  const locale = LANGS.includes(str(fd, "locale")) ? str(fd, "locale") : "en";
  if (title.length < 2) back("/admin/content", "error", "Article title required");
  const slug = str(fd, "slug") ? slugify(str(fd, "slug")) : slugify(title);
  const status = ["draft", "published", "archived"].includes(str(fd, "status")) ? str(fd, "status") : "draft";
  try {
    if (id && UUID.test(id)) {
      await sql`UPDATE articles SET slug = ${slug}, locale = ${locale}, title = ${title}, excerpt = ${str(fd, "excerpt", 400)},
                body = ${str(fd, "body", 100000)}, category = ${str(fd, "category", 40) || "news"}, status = ${status},
                published_at = CASE WHEN ${status} = 'published' THEN coalesce(published_at, now()) ELSE published_at END,
                is_sample = false, updated_at = now() WHERE id = ${id}`;
    } else {
      await sql`INSERT INTO articles (slug, locale, title, excerpt, body, category, status, published_at, author_id)
                VALUES (${slug}, ${locale}, ${title}, ${str(fd, "excerpt", 400)}, ${str(fd, "body", 100000)}, ${str(fd, "category", 40) || "news"},
                        ${status}, ${status === "published" ? new Date() : null}, ${u.id})`;
    }
  } catch (e) {
    if (isUniqueViolation(e)) back("/admin/content", "error", "An article with this slug already exists in that language");
    throw e;
  }
  await audit(u.id, "article.save", "article", slug, { locale, status });
  revalidatePath("/", "layout");
  back("/admin/content", "ok", "Article saved");
}

export async function saveDevotional(fd: FormData) {
  const u = await requirePermission("content.manage");
  const day = str(fd, "day", 10);
  const locale = LANGS.includes(str(fd, "locale")) ? str(fd, "locale") : "en";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) back("/admin/content", "error", "Choose a date");
  await sql`INSERT INTO devotionals (day, locale, title, scripture_ref, scripture_text, translation, body, status)
            VALUES (${day}, ${locale}, ${str(fd, "title", 200)}, ${str(fd, "scripture_ref", 100)}, ${str(fd, "scripture_text", 2000)},
                    ${str(fd, "translation", 100)}, ${str(fd, "body", 20000)}, ${bool(fd, "draft") ? "draft" : "published"})
            ON CONFLICT (day, locale) DO UPDATE SET title = EXCLUDED.title, scripture_ref = EXCLUDED.scripture_ref,
              scripture_text = EXCLUDED.scripture_text, translation = EXCLUDED.translation, body = EXCLUDED.body,
              status = EXCLUDED.status, is_sample = false`;
  await audit(u.id, "devotional.save", "devotional", `${day}/${locale}`);
  revalidatePath("/", "layout");
  back("/admin/content", "ok", "Devotional saved");
}

export async function saveEvent(fd: FormData) {
  const u = await requirePermission("content.manage");
  const id = str(fd, "id");
  const title = tr(fd, "title", 200);
  const starts = new Date(str(fd, "starts_at"));
  if (!title.en || isNaN(+starts)) back("/admin/content", "error", "Event needs an English title and start time");
  const ends = str(fd, "ends_at") ? new Date(str(fd, "ends_at")) : null;
  const slug = str(fd, "slug") ? slugify(str(fd, "slug")) : slugify(title.en);
  const status = ["draft", "published", "cancelled"].includes(str(fd, "status")) ? str(fd, "status") : "draft";
  try {
    if (id && UUID.test(id)) {
      await sql`UPDATE events SET slug = ${slug}, title = ${sql.json(title)}, description = ${sql.json(tr(fd, "description", 5000))},
                kind = ${str(fd, "kind", 30) || "community"}, starts_at = ${starts}, ends_at = ${ends}, location = ${str(fd, "location", 200)},
                registration_enabled = ${bool(fd, "registration_enabled")}, capacity = ${int(fd, "capacity")}, status = ${status}, is_sample = false
                WHERE id = ${id}`;
    } else {
      await sql`INSERT INTO events (slug, title, description, kind, starts_at, ends_at, location, registration_enabled, capacity, status)
                VALUES (${slug}, ${sql.json(title)}, ${sql.json(tr(fd, "description", 5000))}, ${str(fd, "kind", 30) || "community"}, ${starts}, ${ends},
                        ${str(fd, "location", 200)}, ${bool(fd, "registration_enabled")}, ${int(fd, "capacity")}, ${status})`;
    }
  } catch (e) {
    if (isUniqueViolation(e)) back("/admin/content", "error", "An event with this slug already exists");
    throw e;
  }
  await audit(u.id, "event.save", "event", slug, { status });
  revalidatePath("/", "layout");
  back("/admin/content", "ok", "Event saved");
}

export async function savePage(fd: FormData) {
  const u = await requirePermission("content.manage");
  const slug = str(fd, "slug", 40);
  const locale = LANGS.includes(str(fd, "locale")) ? str(fd, "locale") : "en";
  if (!["about", "mission", "leadership", "faq", "privacy", "terms", "accessibility"].includes(slug)) back("/admin/content", "error", "Unknown page");
  await sql`INSERT INTO pages (slug, locale, title, body, is_sample, updated_by) VALUES (${slug}, ${locale}, ${str(fd, "title", 200)}, ${str(fd, "body", 100000)}, false, ${u.id})
            ON CONFLICT (slug, locale) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, is_sample = false, updated_at = now(), updated_by = EXCLUDED.updated_by`;
  await audit(u.id, "page.save", "page", `${slug}/${locale}`);
  revalidatePath("/", "layout");
  back(`/admin/content?page=${slug}&pl=${locale}`, "ok", "Page saved");
}

// ------------------------------------------------------------------ community moderation
export async function moderatePrayer(fd: FormData) {
  const id = str(fd, "id");
  const u = await getCurrentUser();
  const canManage = u && hasPermission(u.permissions, "prayer.manage");
  // Prayer team members may only update requests assigned to them.
  const actor = canManage ? await requirePermission("prayer.manage") : await requirePermission("prayer.view_assigned");
  if (!UUID.test(id)) back("/admin/community", "error", "Unknown request");
  const status = str(fd, "status");
  const assign = str(fd, "assigned_to");
  if (!["pending", "approved", "rejected", "answered"].includes(status)) back("/admin/community", "error", "Invalid status");
  const rows = canManage
    ? await sql`UPDATE prayer_requests SET status = ${status}, assigned_to = ${UUID.test(assign) ? assign : null} WHERE id = ${id} RETURNING id`
    : await sql`UPDATE prayer_requests SET status = ${status === "answered" ? "answered" : "pending"} WHERE id = ${id} AND assigned_to = ${actor.id} RETURNING id`;
  if (!rows.length) back("/admin/community", "error", "Not permitted");
  await audit(actor.id, "prayer.moderate", "prayer_request", id, { status, assigned: UUID.test(assign) });
  revalidatePath("/", "layout");
  back("/admin/community", "ok", "Prayer request updated");
}

export async function moderateTestimony(fd: FormData) {
  const u = await requirePermission("community.moderate");
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!UUID.test(id) || !["pending", "approved", "rejected"].includes(status)) back("/admin/community", "error", "Invalid request");
  try {
    await sql`UPDATE testimonies SET status = ${status}, featured = ${bool(fd, "featured")},
              published_at = CASE WHEN ${status} = 'approved' THEN coalesce(published_at, now()) ELSE NULL END WHERE id = ${id}`;
  } catch (e) {
    if (isCheckViolation(e)) back("/admin/community", "error", "This person did not consent to publication — it cannot be approved.");
    throw e;
  }
  await audit(u.id, "testimony.moderate", "testimony", id, { status });
  revalidatePath("/", "layout");
  back("/admin/community", "ok", "Testimony updated");
}

export async function updateMessage(fd: FormData) {
  const u = await requirePermission("community.moderate");
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!UUID.test(id) || !["new", "read", "archived"].includes(status)) back("/admin/community", "error", "Invalid request");
  await sql`UPDATE contact_messages SET status = ${status} WHERE id = ${id}`;
  await audit(u.id, "contact.status", "contact_message", id, { status });
  back("/admin/community", "ok", "Message updated");
}

export async function updateInquiry(fd: FormData) {
  const u = await requirePermission("finance.view");
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!UUID.test(id) || !["new", "contacted", "closed"].includes(status)) back("/admin/finance", "error", "Invalid request");
  await sql`UPDATE sponsorship_inquiries SET status = ${status} WHERE id = ${id}`;
  await audit(u.id, "sponsorship.status", "sponsorship_inquiry", id, { status });
  back("/admin/finance", "ok", "Inquiry updated");
}

// ------------------------------------------------------------------ users & roles
export async function changeRole(fd: FormData) {
  const u = await requirePermission("users.manage");
  const userId = str(fd, "user_id");
  const role = str(fd, "role", 40);
  const op = str(fd, "op");
  if (!UUID.test(userId)) back("/admin/users", "error", "Unknown user");
  if (userId === u.id && op === "remove" && role === "super_admin") back("/admin/users", "error", "You cannot remove your own Super Administrator role");
  if (op === "add") {
    await sql`INSERT INTO user_roles (user_id, role_key, granted_by) SELECT ${userId}, key, ${u.id} FROM roles WHERE key = ${role} ON CONFLICT DO NOTHING`;
  } else {
    await sql`DELETE FROM user_roles WHERE user_id = ${userId} AND role_key = ${role}`;
  }
  // Role changes end the target's other sessions so new permissions apply immediately.
  if (userId !== u.id) await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  await audit(u.id, `role.${op}`, "user", userId, { role });
  back("/admin/users", "ok", "Roles updated");
}

export async function setUserStatus(fd: FormData) {
  const u = await requirePermission("users.manage");
  const userId = str(fd, "user_id");
  const status = str(fd, "status");
  if (!UUID.test(userId) || !["active", "suspended"].includes(status)) back("/admin/users", "error", "Invalid request");
  if (userId === u.id) back("/admin/users", "error", "You cannot suspend yourself");
  await sql`UPDATE users SET status = ${status}, updated_at = now() WHERE id = ${userId}`;
  if (status === "suspended") await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  await audit(u.id, "user.status", "user", userId, { status });
  back("/admin/users", "ok", "Account updated");
}

export async function resetUserMfa(fd: FormData) {
  const u = await requirePermission("users.manage");
  const userId = str(fd, "user_id");
  if (!UUID.test(userId)) back("/admin/users", "error", "Unknown user");
  await sql`UPDATE users SET totp_secret_enc = NULL, totp_enabled_at = NULL, totp_last_step = NULL WHERE id = ${userId}`;
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  await audit(u.id, "user.mfa_reset", "user", userId);
  back("/admin/users", "ok", "MFA reset — they will enroll again at next sign-in");
}

// ------------------------------------------------------------------ integrations
export async function saveIntegration(fd: FormData) {
  const u = await requirePermission("integrations.manage");
  const key = str(fd, "key", 40);
  const url = optStr(fd, "url", 500);
  if (url && !url.startsWith("https://")) back("/admin/integrations", "error", "URLs must start with https://");
  // Changing the URL clears verification: a person must test the new link.
  await sql`UPDATE platform_integrations SET url = ${url}, identifier = ${optStr(fd, "identifier", 200)}, enabled = ${bool(fd, "enabled")},
            verified_at = CASE WHEN url IS DISTINCT FROM ${url} THEN NULL ELSE verified_at END, updated_at = now() WHERE key = ${key}`;
  await audit(u.id, "integration.save", "integration", key, { enabled: bool(fd, "enabled"), hasUrl: !!url });
  revalidatePath("/", "layout");
  back("/admin/integrations", "ok", "Integration saved");
}

export async function verifyIntegration(fd: FormData) {
  const u = await requirePermission("integrations.manage");
  const key = str(fd, "key", 40);
  const verified = str(fd, "op") === "verify";
  await sql`UPDATE platform_integrations SET verified_at = ${verified ? new Date() : null}, updated_at = now() WHERE key = ${key} AND url IS NOT NULL`;
  await audit(u.id, verified ? "integration.verify" : "integration.unverify", "integration", key);
  revalidatePath("/", "layout");
  back("/admin/integrations", "ok", verified ? "Marked as tested — it is now shown publicly (if enabled)" : "Verification removed");
}

// ------------------------------------------------------------------ launch readiness
export async function purgeSampleContent(fd: FormData) {
  const u = await requirePermission("sample.purge");
  if (str(fd, "confirm") !== "REMOVE SAMPLE CONTENT") back("/admin/launch", "error", "Type the confirmation phrase exactly");
  const keys = await sql<{ storage_key: string }[]>`
    SELECT a.storage_key FROM media_assets a WHERE a.id IN (SELECT audio_asset_id FROM episodes WHERE is_sample AND audio_asset_id IS NOT NULL)`;
  await sql.begin(async (tx) => {
    await tx`DELETE FROM episodes WHERE is_sample`;
    await tx`DELETE FROM programs WHERE is_sample`;
    await tx`DELETE FROM presenters WHERE is_sample`;
    await tx`DELETE FROM articles WHERE is_sample`;
    await tx`DELETE FROM devotionals WHERE is_sample`;
    await tx`DELETE FROM events WHERE is_sample`;
    await tx`DELETE FROM fundraising_campaigns WHERE is_sample AND NOT EXISTS (SELECT 1 FROM donations d WHERE d.campaign_id = fundraising_campaigns.id)`;
    await tx`DELETE FROM media_assets a WHERE a.storage_key = ANY(${keys.map((k) => k.storage_key)})`;
  });
  for (const k of keys) await removeKey(k.storage_key).catch(() => {});
  await audit(u.id, "sample.purge", "station", null, { mediaFiles: keys.length });
  revalidatePath("/", "layout");
  back("/admin/launch", "ok", "Sample content removed. Pages marked as templates are kept so legal pages are not lost — edit them in Content.");
}
