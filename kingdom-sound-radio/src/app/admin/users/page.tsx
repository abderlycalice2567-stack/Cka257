import { sql } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { sp } from "@/lib/page";
import { AdminHeader, Badge, Flash, Panel, Table } from "@/components/admin/ui";
import { changeRole, resetUserMfa, setUserStatus } from "../actions";

export const metadata = { title: "Users & roles" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requirePermission("users.manage");
  const q = await searchParams;
  const search = (sp(q.q) ?? "").trim().slice(0, 100);
  const like = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
  const [users, roles] = await Promise.all([
    sql<{ id: string; email: string; display_name: string; status: string; created_at: Date; email_verified_at: Date | null; totp_enabled_at: Date | null; roles: string[] }[]>`
      SELECT u.id, u.email, u.display_name, u.status, u.created_at, u.email_verified_at, u.totp_enabled_at,
             coalesce(array_agg(r.role_key ORDER BY r.role_key) FILTER (WHERE r.role_key IS NOT NULL), '{}') AS roles
        FROM users u LEFT JOIN user_roles r ON r.user_id = u.id
       ${search ? sql`WHERE u.email ILIKE ${like} OR u.display_name ILIKE ${like}` : sql``}
       GROUP BY u.id ORDER BY bool_or(r.role_key <> 'subscriber') DESC NULLS LAST, u.created_at DESC LIMIT 100`,
    sql<{ key: string; name: string; description: string }[]>`SELECT key, name, description FROM roles ORDER BY is_staff DESC, name`,
  ]);
  return (
    <>
      <AdminHeader title="Users & roles" intro="Least privilege: give each person only the roles they need. Role changes sign the person out so new permissions apply immediately. All staff roles require two-step verification." />
      <Flash sp={q} />
      <form className="mb-4 flex max-w-md gap-2"><input name="q" defaultValue={search} placeholder="Search email or name" className="input" /><button className="btn-outline btn-sm" type="submit">Search</button></form>
      <Panel>
        <Table head={["Account", "Roles", "Security", "Actions"]}>
          {users.map((u) => (
            <tr key={u.id} className="align-top">
              <td className="px-3 py-3"><strong>{u.display_name}</strong><span className="block text-xs text-muted">{u.email}</span>{u.status !== "active" && <Badge tone="warn">{u.status}</Badge>}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <form key={r} action={changeRole}>
                      <input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="role" value={r} /><input type="hidden" name="op" value="remove" />
                      <button type="submit" className="chip hover:border-live hover:text-live" title="Remove role">{r} ×</button>
                    </form>
                  ))}
                </div>
                <form action={changeRole} className="mt-2 flex gap-1">
                  <input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="op" value="add" />
                  <select name="role" className="input !w-44 !py-1 text-xs">{roles.filter((r) => !u.roles.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</select>
                  <button className="btn-outline btn-sm" type="submit">Add</button>
                </form>
              </td>
              <td className="px-3 py-3 text-xs">
                <p>{u.email_verified_at ? "Email verified" : "Email unverified"}</p>
                <p>{u.totp_enabled_at ? "2-step enabled" : "2-step not set up"}</p>
              </td>
              <td className="px-3 py-3">
                {u.id !== me.id && (
                  <div className="flex flex-col gap-1">
                    <form action={setUserStatus}><input type="hidden" name="user_id" value={u.id} /><input type="hidden" name="status" value={u.status === "active" ? "suspended" : "active"} /><button className="btn-outline btn-sm" type="submit">{u.status === "active" ? "Suspend" : "Reactivate"}</button></form>
                    {u.totp_enabled_at && <form action={resetUserMfa}><input type="hidden" name="user_id" value={u.id} /><button className="btn-outline btn-sm" type="submit">Reset 2-step</button></form>}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Role reference" className="mt-6">
        <ul className="grid gap-2 text-sm md:grid-cols-2">{roles.map((r) => <li key={r.key}><strong>{r.name}</strong> — <span className="text-muted">{r.description}</span></li>)}</ul>
      </Panel>
    </>
  );
}
