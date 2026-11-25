import { sql } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { sp } from "@/lib/page";
import { AdminHeader, Panel, Table } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };

export default async function AdminAudit({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("audit.view");
  const action = (sp((await searchParams).action) ?? "").slice(0, 60);
  const rows = await sql<{ id: string; created_at: Date; action: string; entity_type: string | null; entity_id: string | null; metadata: Record<string, unknown>; ip: string | null; email: string | null }[]>`
    SELECT a.id, a.created_at, a.action, a.entity_type, a.entity_id, a.metadata, a.ip, u.email
      FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
     ${action ? sql`WHERE a.action LIKE ${action.replace(/[%_\\]/g, "\\$&") + "%"}` : sql``}
     ORDER BY a.created_at DESC LIMIT 300`;
  return (
    <>
      <AdminHeader title="Audit log" intro="Sensitive actions: sign-ins, MFA, role changes, publishing, moderation, uploads, settings and exports. Entries are append-only from the application." />
      <form className="mb-4 flex max-w-md gap-2"><input name="action" defaultValue={action} placeholder="Filter by action prefix, e.g. auth. or episode." className="input" /><button className="btn-outline btn-sm" type="submit">Filter</button></form>
      <Panel>
        <Table head={["When (UTC)", "Who", "Action", "Target", "Details", "IP"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-3 py-2 text-xs">{r.created_at.toISOString().slice(0, 19).replace("T", " ")}</td>
              <td className="px-3 py-2 text-xs">{r.email ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
              <td className="px-3 py-2 text-xs">{r.entity_type}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}</td>
              <td className="max-w-xs truncate px-3 py-2 font-mono text-[11px] text-muted">{Object.keys(r.metadata).length ? JSON.stringify(r.metadata) : ""}</td>
              <td className="px-3 py-2 text-xs">{r.ip}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
