import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { pick } from "@/lib/i18n/config";
import { UUID } from "@/lib/admin";
import { requirePermission } from "@/lib/auth/session";
import { listCategories, type Tr } from "@/modules/catalog";
import { AdminHeader, Check, Flash, Input, Panel, TrFields } from "@/components/admin/ui";
import { saveProgram } from "../../actions";

export const metadata = { title: "Edit program" };

type Program = { id: string; slug: string; title: Tr; summary: Tr; description: Tr; category_id: string | null; languages: string[]; featured: boolean; status: string; podcast_enabled: boolean; podcast_author: string | null; podcast_explicit: boolean; external_links: Record<string, string>; cover_key: string | null };

export default async function EditProgram({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("programs.manage");
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();
  const [rows, categories, presenters, assigned] = await Promise.all([
    isNew ? Promise.resolve([] as Program[]) : sql<Program[]>`SELECT p.*, a.storage_key AS cover_key FROM programs p LEFT JOIN media_assets a ON a.id = p.cover_asset_id WHERE p.id = ${id}`,
    listCategories(),
    sql<{ id: string; display_name: string }[]>`SELECT id, display_name FROM presenters ORDER BY display_name`,
    isNew ? Promise.resolve([]) : sql<{ presenter_id: string }[]>`SELECT presenter_id FROM program_presenters WHERE program_id = ${id}`,
  ]);
  const p = rows[0];
  if (!isNew && !p) notFound();
  const has = new Set(assigned.map((a) => a.presenter_id));
  return (
    <>
      <AdminHeader title={isNew ? "New program" : pick(p!.title, "en")} actions={!isNew && p!.status === "published" ? <Link className="btn-outline btn-sm" href={`/en/programs/${p!.slug}`}>View on site</Link> : undefined} />
      <Flash sp={await searchParams} />
      <form action={saveProgram} encType="multipart/form-data" className="space-y-6">
        {!isNew && <input type="hidden" name="id" value={p!.id} />}
        <Panel title="Identity">
          <div className="space-y-4">
            <TrFields name="title" label="Title" value={p?.title} required />
            <TrFields name="summary" label="Short summary" value={p?.summary} />
            <TrFields name="description" label="Description" value={p?.description} textarea rows={4} />
            <div className="grid gap-3 md:grid-cols-3">
              <Input name="slug" label="URL slug" defaultValue={p?.slug} hint="Leave blank to generate from the English title" />
              <label className="block"><span className="label">Category</span>
                <select name="category_id" defaultValue={p?.category_id ?? ""} className="input">
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{pick(c.name, "en")}</option>)}
                </select>
              </label>
              <label className="block"><span className="label">Status</span>
                <select name="status" defaultValue={p?.status ?? "draft"} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
              </label>
            </div>
            <div className="flex flex-wrap gap-5">
              <span className="text-sm font-medium">Broadcast languages:</span>
              {(["en", "fr", "ht"] as const).map((l) => <Check key={l} name={`lang_${l}`} label={l.toUpperCase()} defaultChecked={p ? p.languages.includes(l) : l === "en"} />)}
              <Check name="featured" label="Featured on homepage" defaultChecked={p?.featured} />
            </div>
            <label className="block"><span className="label">Cover artwork (JPG/PNG/WebP, max 8 MB)</span><input type="file" name="cover" accept="image/png,image/jpeg,image/webp" className="text-sm" /></label>
            {p?.cover_key && <p className="text-xs text-muted">Current cover: /media/{p.cover_key}</p>}
          </div>
        </Panel>
        <Panel title="Presenters">
          <div className="flex flex-wrap gap-4">
            {presenters.map((pr) => (
              <label key={pr.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="presenters" value={pr.id} defaultChecked={has.has(pr.id)} className="h-4 w-4 accent-[#D4AF37]" /> {pr.display_name}</label>
            ))}
          </div>
        </Panel>
        <Panel title="Podcast & distribution">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-5">
              <Check name="podcast_enabled" label="Publish a podcast RSS feed for this program" defaultChecked={p?.podcast_enabled} />
              <Check name="podcast_explicit" label="Explicit content" defaultChecked={p?.podcast_explicit} />
            </div>
            <Input name="podcast_author" label="Podcast author" defaultValue={p?.podcast_author} />
            <div className="grid gap-3 md:grid-cols-2">
              {["spotify", "apple", "youtube", "amazon", "deezer"].map((k) => <Input key={k} name={`link_${k}`} label={`${k[0]!.toUpperCase()}${k.slice(1)} URL`} defaultValue={p?.external_links?.[k]} placeholder="https://" />)}
            </div>
            <p className="text-xs text-muted">Add an external link only after the show is live on that platform — links are shown publicly as soon as they are saved.</p>
          </div>
        </Panel>
        <button className="btn-gold" type="submit">Save program</button>
      </form>
    </>
  );
}
