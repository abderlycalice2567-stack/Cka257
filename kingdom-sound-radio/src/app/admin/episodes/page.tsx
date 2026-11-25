import Link from "next/link";
import { sql } from "@/lib/db";
import { pick } from "@/lib/i18n/config";
import { requirePermission } from "@/lib/auth/session";
import { sp } from "@/lib/page";
import type { Tr } from "@/modules/catalog";
import { AdminHeader, Badge, Flash, Panel, STATUS_TONE, Table } from "@/components/admin/ui";

export const metadata = { title: "Episodes" };
const STATUSES = ["draft", "scheduled", "recording", "processing", "awaiting_review", "approved", "published", "archived", "rejected", "failed"];

export default async function AdminEpisodes({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("episodes.manage");
  const q = await searchParams;
  const status = STATUSES.includes(sp(q.status) ?? "") ? sp(q.status)! : null;
  const rows = await sql<{ id: string; title: string; status: string; language: string; published_at: Date | null; program: Tr; has_audio: boolean; rights_confirmed: boolean; is_sample: boolean }[]>`
    SELECT e.id, e.title, e.status, e.language, e.published_at, p.title AS program, e.audio_asset_id IS NOT NULL AS has_audio, e.rights_confirmed, e.is_sample
      FROM episodes e JOIN programs p ON p.id = e.program_id
     ${status ? sql`WHERE e.status = ${status}` : sql``}
     ORDER BY e.updated_at DESC LIMIT 200`;
  return (
    <>
      <AdminHeader title="Episodes & media" intro="Every recording goes through review: copyright, privacy and publication rights must be confirmed before an episode is published or added to podcast feeds." actions={<Link href="/admin/episodes/new" className="btn-gold btn-sm">New episode / upload</Link>} />
      <Flash sp={q} />
      <nav className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/episodes" className={!status ? "btn-gold btn-sm" : "btn-outline btn-sm"}>All</Link>
        {STATUSES.map((s) => <Link key={s} href={`/admin/episodes?status=${s}`} className={status === s ? "btn-gold btn-sm" : "btn-outline btn-sm"}>{s.replace("_", " ")}</Link>)}
      </nav>
      <Panel>
        <Table head={["Episode", "Program", "Status", "Audio", "Rights", "Published"]}>
          {rows.map((e) => (
            <tr key={e.id}>
              <td className="px-3 py-2"><Link className="link font-medium" href={`/admin/episodes/${e.id}`}>{e.title}</Link> <span className="text-xs text-muted">{e.language.toUpperCase()}</span> {e.is_sample && <Badge>sample</Badge>}</td>
              <td className="px-3 py-2">{pick(e.program, "en")}</td>
              <td className="px-3 py-2"><Badge tone={STATUS_TONE[e.status]}>{e.status.replace("_", " ")}</Badge></td>
              <td className="px-3 py-2">{e.has_audio ? "✓" : "—"}</td>
              <td className="px-3 py-2">{e.rights_confirmed ? <Badge tone="ok">confirmed</Badge> : <Badge>pending</Badge>}</td>
              <td className="px-3 py-2 text-xs text-muted">{e.published_at?.toISOString().slice(0, 10) ?? "—"}</td>
            </tr>
          ))}
        </Table>
        {!rows.length && <p className="p-4 text-sm text-muted">No episodes with this status.</p>}
      </Panel>
    </>
  );
}
