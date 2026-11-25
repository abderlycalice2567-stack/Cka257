import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { UUID } from "@/lib/admin";
import { requirePermission } from "@/lib/auth/session";
import type { Tr } from "@/modules/catalog";
import { AdminHeader, Check, Flash, Input, Panel, TrFields } from "@/components/admin/ui";
import { savePresenter } from "../../actions";

export const metadata = { title: "Edit presenter" };

export default async function EditPresenter({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("presenters.manage");
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();
  const rows = isNew ? [] : await sql<{ id: string; slug: string; display_name: string; title: Tr; bio: Tr; published: boolean; photo_key: string | null; is_sample: boolean }[]>`
    SELECT pr.*, a.storage_key AS photo_key FROM presenters pr LEFT JOIN media_assets a ON a.id = pr.photo_asset_id WHERE pr.id = ${id}`;
  const p = rows[0];
  if (!isNew && !p) notFound();
  return (
    <>
      <AdminHeader title={isNew ? "New presenter" : p!.display_name} intro="Publish only names, photographs and biographies the presenter has approved." />
      <Flash sp={await searchParams} />
      <form action={savePresenter} encType="multipart/form-data">
        {!isNew && <input type="hidden" name="id" value={p!.id} />}
        <Panel>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="display_name" label="Display name" defaultValue={p?.display_name} required />
              <Input name="slug" label="URL slug" defaultValue={p?.slug} hint="Leave blank to generate" />
            </div>
            <TrFields name="title" label="Role / title" value={p?.title} />
            <TrFields name="bio" label="Biography" value={p?.bio} textarea rows={5} />
            <label className="block"><span className="label">Photograph (JPG/PNG/WebP, max 8 MB)</span><input type="file" name="photo" accept="image/png,image/jpeg,image/webp" className="text-sm" /></label>
            <Check name="published" label="Show on the website" defaultChecked={p ? p.published : true} />
            {p?.is_sample && <p className="text-xs text-muted">Saving this profile marks it as real (no longer sample).</p>}
            <button className="btn-gold" type="submit">Save presenter</button>
          </div>
        </Panel>
      </form>
    </>
  );
}
