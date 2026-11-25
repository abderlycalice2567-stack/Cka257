import Link from "next/link";
import { sql } from "@/lib/db";
import { pick } from "@/lib/i18n/config";
import { requirePermission } from "@/lib/auth/session";
import type { Tr } from "@/modules/catalog";
import { AdminHeader, Badge, Flash, Panel, Table } from "@/components/admin/ui";

export const metadata = { title: "Presenters" };

export default async function AdminPresenters({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("presenters.manage");
  const rows = await sql<{ id: string; slug: string; display_name: string; title: Tr; published: boolean; is_sample: boolean; programs: number }[]>`
    SELECT pr.id, pr.slug, pr.display_name, pr.title, pr.published, pr.is_sample,
           (SELECT count(*)::int FROM program_presenters pp WHERE pp.presenter_id = pr.id) AS programs
      FROM presenters pr ORDER BY pr.display_name`;
  return (
    <>
      <AdminHeader title="Presenters" actions={<Link href="/admin/presenters/new" className="btn-gold btn-sm">New presenter</Link>} />
      <Flash sp={await searchParams} />
      <Panel>
        <Table head={["Name", "Title", "Programs", "Status"]}>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-2"><Link className="link font-medium" href={`/admin/presenters/${p.id}`}>{p.display_name}</Link> {p.is_sample && <Badge>sample</Badge>}</td>
              <td className="px-3 py-2">{pick(p.title, "en")}</td>
              <td className="px-3 py-2">{p.programs}</td>
              <td className="px-3 py-2"><Badge tone={p.published ? "ok" : "muted"}>{p.published ? "published" : "hidden"}</Badge></td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
