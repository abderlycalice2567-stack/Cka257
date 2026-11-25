import Link from "next/link";
import { sql } from "@/lib/db";
import { pick } from "@/lib/i18n/config";
import { requirePermission } from "@/lib/auth/session";
import { listCategories, type Tr } from "@/modules/catalog";
import { AdminHeader, Badge, Flash, Panel, STATUS_TONE, Table, TrFields } from "@/components/admin/ui";
import { saveCategory } from "../actions";

export const metadata = { title: "Programs" };

export default async function AdminPrograms({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("programs.manage");
  const [programs, categories] = await Promise.all([
    sql<{ id: string; slug: string; title: Tr; status: string; featured: boolean; is_sample: boolean; category: Tr | null; episodes: number; podcast_enabled: boolean }[]>`
      SELECT p.id, p.slug, p.title, p.status, p.featured, p.is_sample, p.podcast_enabled, c.name AS category,
             (SELECT count(*)::int FROM episodes e WHERE e.program_id = p.id) AS episodes
        FROM programs p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.status, p.title->>'en'`,
    listCategories(),
  ]);
  return (
    <>
      <AdminHeader title="Programs" intro="Recurring shows with their own identity, presenters and schedule." actions={<Link href="/admin/programs/new" className="btn-gold btn-sm">New program</Link>} />
      <Flash sp={await searchParams} />
      <Panel>
        <Table head={["Program", "Category", "Status", "Episodes", "Podcast"]}>
          {programs.map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-2"><Link className="font-medium link" href={`/admin/programs/${p.id}`}>{pick(p.title, "en")}</Link> {p.featured && <Badge tone="gold">featured</Badge>} {p.is_sample && <Badge>sample</Badge>}<span className="block text-xs text-muted">/{p.slug}</span></td>
              <td className="px-3 py-2">{p.category ? pick(p.category, "en") : "—"}</td>
              <td className="px-3 py-2"><Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge></td>
              <td className="px-3 py-2">{p.episodes}</td>
              <td className="px-3 py-2">{p.podcast_enabled ? <a className="link text-xs" href={`/feeds/podcasts/${p.slug}.xml`}>RSS</a> : "—"}</td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Categories" className="mt-6">
        <ul className="mb-5 flex flex-wrap gap-2">{categories.map((c) => <li key={c.id} className="chip">{pick(c.name, "en")}</li>)}</ul>
        <form action={saveCategory} className="space-y-3 border-t border-line pt-4">
          <TrFields name="name" label="New / rename category (matches by slug)" required />
          <div className="flex items-end gap-3">
            <label className="block"><span className="label">Slug</span><input name="slug" className="input" placeholder="auto" /></label>
            <label className="block w-24"><span className="label">Order</span><input name="sort" type="number" className="input" defaultValue={100} /></label>
            <button className="btn-gold btn-sm h-[42px]" type="submit">Save category</button>
          </div>
        </form>
      </Panel>
    </>
  );
}
