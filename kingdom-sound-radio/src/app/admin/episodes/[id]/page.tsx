import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { pick } from "@/lib/i18n/config";
import { UUID } from "@/lib/admin";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { formatDuration } from "@/lib/i18n";
import type { Tr } from "@/modules/catalog";
import { AdminHeader, Badge, Check, Flash, Input, Panel, STATUS_TONE, TextArea } from "@/components/admin/ui";
import { deleteEpisode, saveEpisode, setEpisodeStatus } from "../../actions";

export const metadata = { title: "Edit episode" };

type Ep = { id: string; program_id: string; slug: string; title: string; description: string; language: string; status: string; number: number | null; original_air_date: Date | null; published_at: Date | null; transcript: string | null; scripture_refs: string[]; topics: string[]; downloadable: boolean; rights_confirmed: boolean; duration_seconds: number | null; audio_key: string | null; audio_bytes: number | null; program_slug: string };

const NEXT: Record<string, string[]> = {
  draft: ["awaiting_review", "processing", "scheduled", "archived"],
  scheduled: ["awaiting_review", "recording", "draft"],
  recording: ["processing", "failed"],
  processing: ["awaiting_review", "failed"],
  failed: ["processing", "draft"],
  awaiting_review: ["published", "approved", "rejected", "draft"],
  approved: ["published", "rejected", "awaiting_review"],
  rejected: ["draft"],
  published: ["archived", "awaiting_review"],
  archived: ["published", "draft"],
};

export default async function EditEpisode({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePermission("episodes.manage");
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();
  const [rows, programs, chapters] = await Promise.all([
    isNew ? Promise.resolve([] as Ep[]) : sql<Ep[]>`
      SELECT e.*, a.storage_key AS audio_key, a.bytes::int AS audio_bytes, p.slug AS program_slug,
             coalesce(e.duration_seconds, a.duration_seconds) AS duration_seconds
        FROM episodes e JOIN programs p ON p.id = e.program_id LEFT JOIN media_assets a ON a.id = e.audio_asset_id WHERE e.id = ${id}`,
    sql<{ id: string; title: Tr }[]>`SELECT id, title FROM programs WHERE status <> 'archived' ORDER BY title->>'en'`,
    isNew ? Promise.resolve([]) : sql<{ start_seconds: number; title: string }[]>`SELECT start_seconds, title FROM episode_chapters WHERE episode_id = ${id} ORDER BY start_seconds`,
  ]);
  const e = rows[0];
  if (!isNew && !e) notFound();
  const canPublish = hasPermission(user.permissions, "episodes.publish");
  const chapterText = chapters.map((c) => `${formatDuration(c.start_seconds) || "0:00"} ${c.title}`).join("\n");

  return (
    <>
      <AdminHeader
        title={isNew ? "New episode" : e!.title}
        intro={isNew ? "Upload a recording (MP3, M4A/AAC, OGG or WAV — max 95 MB). New uploads start as “awaiting review” and stay private until published." : undefined}
        actions={!isNew && e!.status === "published" ? <Link className="btn-outline btn-sm" href={`/${e!.language}/programs/${e!.program_slug}/${e!.slug}`}>View on site</Link> : undefined}
      />
      <Flash sp={await searchParams} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <form action={saveEpisode} encType="multipart/form-data" className="space-y-6">
          {!isNew && <input type="hidden" name="id" value={e!.id} />}
          <Panel title="Details">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block"><span className="label">Program *</span>
                  <select name="program_id" defaultValue={e?.program_id ?? ""} className="input" required>
                    <option value="" disabled>Choose…</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{pick(p.title, "en")}</option>)}
                  </select>
                </label>
                <Input name="title" label="Title" defaultValue={e?.title} required />
              </div>
              <TextArea name="description" label="Description" defaultValue={e?.description} rows={4} />
              <div className="grid gap-3 md:grid-cols-4">
                <label className="block"><span className="label">Language</span>
                  <select name="language" defaultValue={e?.language ?? "en"} className="input"><option value="en">English</option><option value="fr">Français</option><option value="ht">Kreyòl</option></select>
                </label>
                <Input name="number" label="Episode #" type="number" defaultValue={e?.number} />
                <Input name="original_air_date" label="Original air date" type="date" defaultValue={e?.original_air_date?.toISOString().slice(0, 10)} />
                <Input name="slug" label="URL slug" defaultValue={e?.slug} hint="Auto from title" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input name="scripture_refs" label="Scripture references" defaultValue={e?.scripture_refs.join(", ")} hint="Comma-separated, e.g. John 3:16, Psalm 23" />
                <Input name="topics" label="Topics" defaultValue={e?.topics.join(", ")} hint="Comma-separated" />
              </div>
              <Check name="downloadable" label="Allow listeners to download (only if rights permit downloads)" defaultChecked={e?.downloadable} />
            </div>
          </Panel>
          <Panel title="Audio">
            {e?.audio_key ? (
              <div className="mb-4 space-y-2">
                <audio controls preload="none" src={`/media/${e.audio_key}`} className="w-full" />
                <p className="text-xs text-muted">{formatDuration(e.duration_seconds)} · {e.audio_bytes ? `${(e.audio_bytes / 1048576).toFixed(1)} MB` : ""}</p>
              </div>
            ) : <p className="mb-3 text-sm text-muted">No audio yet.</p>}
            <input type="file" name="audio" accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,.mp3,.m4a,.aac,.ogg,.wav" className="text-sm" />
            <p className="mt-2 text-xs text-muted">Files are checked by content (not just extension) and the duration is read automatically.</p>
          </Panel>
          <Panel title="Chapters & transcript">
            <TextArea name="chapters" label="Chapters — one per line: mm:ss Title" defaultValue={chapterText} rows={5} />
            <TextArea name="transcript" label="Transcript" defaultValue={e?.transcript} rows={8} className="mt-4" hint="Paste or edit the transcript. Automatic transcription can be added as a background job (see docs)." />
          </Panel>
          <button className="btn-gold" type="submit">{isNew ? "Create episode" : "Save changes"}</button>
        </form>

        {!isNew && (
          <aside className="space-y-6">
            <Panel title="Editorial status">
              <p className="mb-4"><Badge tone={STATUS_TONE[e!.status]}>{e!.status.replace("_", " ")}</Badge></p>
              <form action={setEpisodeStatus} className="space-y-3">
                <input type="hidden" name="id" value={e!.id} />
                {!e!.rights_confirmed && (
                  <label className="flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs">
                    <input type="checkbox" name="rights_confirmed" className="mt-0.5 h-4 w-4 accent-[#D4AF37]" />
                    I confirm music/recording rights, guest consent and privacy have been reviewed for online and podcast publication.
                  </label>
                )}
                <div className="flex flex-wrap gap-2">
                  {(NEXT[e!.status] ?? []).map((s) => {
                    const needs = ["published", "approved", "rejected"].includes(s) || (["awaiting_review", "approved", "published", "archived"].includes(e!.status) && s !== "draft");
                    return (
                      <button key={s} name="status" value={s} type="submit" disabled={needs && !canPublish} className={s === "published" ? "btn-gold btn-sm" : s === "rejected" ? "btn-outline btn-sm text-live" : "btn-outline btn-sm"} title={needs && !canPublish ? "Requires the Editor role" : undefined}>
                        → {s.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </form>
              {!canPublish && <p className="mt-3 text-xs text-muted">Approving and publishing require the Editor role.</p>}
              {e!.published_at && <p className="mt-3 text-xs text-muted">Published {e!.published_at.toISOString().slice(0, 16).replace("T", " ")} UTC</p>}
            </Panel>
            {canPublish && (
              <Panel title="Danger zone">
                <form action={deleteEpisode}>
                  <input type="hidden" name="id" value={e!.id} />
                  <button className="btn-outline btn-sm text-live" type="submit">Delete episode</button>
                </form>
              </Panel>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
