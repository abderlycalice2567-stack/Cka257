import { sql } from "@/lib/db";
import { getCurrentUser, requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { audit } from "@/lib/audit";
import { AdminHeader, Badge, Check, Flash, Panel, STATUS_TONE } from "@/components/admin/ui";
import { moderatePrayer, moderateTestimony, updateMessage } from "../actions";

export const metadata = { title: "Community" };

export default async function AdminCommunity({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getCurrentUser();
  const canPrayerAll = !!me && hasPermission(me.permissions, "prayer.manage");
  const canModerate = !!me && hasPermission(me.permissions, "community.moderate");
  const u = await requirePermission(canPrayerAll ? "prayer.manage" : canModerate ? "community.moderate" : "prayer.view_assigned");
  const canPrayer = canPrayerAll || hasPermission(u.permissions, "prayer.view_assigned");

  const [prayers, team, testimonies, messages] = await Promise.all([
    canPrayer
      ? sql<{ id: string; name: string; email: string | null; body: string; visibility: string; status: string; assigned_to: string | null; created_at: Date; retain_until: Date }[]>`
          SELECT id, name, email, body, visibility, status, assigned_to, created_at, retain_until FROM prayer_requests
           WHERE retain_until > now() ${canPrayerAll ? sql`` : sql`AND assigned_to = ${u.id}`}
           ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 100`
      : Promise.resolve([]),
    canPrayerAll ? sql<{ id: string; display_name: string }[]>`SELECT DISTINCT u.id, u.display_name FROM users u JOIN user_roles r ON r.user_id = u.id WHERE r.role_key IN ('prayer_team','super_admin','station_director') ORDER BY u.display_name` : Promise.resolve([]),
    canModerate ? sql<{ id: string; name: string; body: string; consent_publish: boolean; status: string; featured: boolean; created_at: Date }[]>`SELECT id, name, body, consent_publish, status, featured, created_at FROM testimonies ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 100` : Promise.resolve([]),
    canModerate ? sql<{ id: string; name: string; email: string; topic: string; body: string; status: string; created_at: Date }[]>`SELECT id, name, email, topic, body, status, created_at FROM contact_messages WHERE status <> 'archived' ORDER BY created_at DESC LIMIT 100` : Promise.resolve([]),
  ]);
  // Viewing confidential submissions is itself recorded.
  if (prayers.length) await audit(u.id, "prayer.view_list", "prayer_request", null, { count: prayers.length });

  return (
    <>
      <AdminHeader title="Community" intro="Confidential submissions are visible only to authorised roles. Prayer requests are automatically excluded after their retention date (180 days)." />
      <Flash sp={await searchParams} />
      <div className="grid gap-6 xl:grid-cols-2">
        {canPrayer && (
          <Panel title={`Prayer requests${canPrayerAll ? "" : " assigned to you"} (${prayers.length})`}>
            <ul className="space-y-4">
              {prayers.map((p) => (
                <li key={p.id} className="rounded-xl border border-line p-4 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2"><strong>{p.name}</strong><Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge><Badge tone={p.visibility === "private" ? "warn" : "muted"}>{p.visibility.replace("_", " ")}</Badge><span className="ml-auto text-xs text-muted">{p.created_at.toISOString().slice(0, 10)}</span></div>
                  <p className="whitespace-pre-line">{p.body}</p>
                  {p.email && <p className="mt-1 text-xs text-muted">{p.email}</p>}
                  <form action={moderatePrayer} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    {canPrayerAll && (
                      <label className="block"><span className="text-[11px] text-muted">Assign to</span>
                        <select name="assigned_to" defaultValue={p.assigned_to ?? ""} className="input !w-44 !py-1 text-xs"><option value="">Unassigned</option>{team.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}</select>
                      </label>
                    )}
                    {(canPrayerAll ? ["approved", "answered", "rejected", "pending"] : ["answered"]).map((s) => (
                      <button key={s} name="status" value={s} className="btn-outline btn-sm" type="submit" title={s === "approved" ? (p.visibility === "private" ? "Private requests are never shown publicly" : "Show on public prayer wall") : undefined}>{s}</button>
                    ))}
                  </form>
                </li>
              ))}
              {!prayers.length && <li className="text-sm text-muted">No requests.</li>}
            </ul>
          </Panel>
        )}
        {canModerate && (
          <Panel title={`Testimonies (${testimonies.length})`}>
            <ul className="space-y-4">
              {testimonies.map((t) => (
                <li key={t.id} className="rounded-xl border border-line p-4 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2"><strong>{t.name}</strong><Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>{t.consent_publish ? <Badge tone="ok">consent given</Badge> : <Badge tone="warn">no publication consent</Badge>}</div>
                  <p className="whitespace-pre-line">{t.body}</p>
                  <form action={moderateTestimony} className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <Check name="featured" label="Featured" defaultChecked={t.featured} />
                    <button name="status" value="approved" className="btn-outline btn-sm" type="submit" disabled={!t.consent_publish}>Approve</button>
                    <button name="status" value="rejected" className="btn-outline btn-sm" type="submit">Reject</button>
                    <button name="status" value="pending" className="btn-outline btn-sm" type="submit">Pending</button>
                  </form>
                </li>
              ))}
              {!testimonies.length && <li className="text-sm text-muted">No testimonies yet.</li>}
            </ul>
          </Panel>
        )}
        {canModerate && (
          <Panel title={`Contact messages (${messages.length})`} className="xl:col-span-2">
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m.id} className="rounded-xl border border-line p-4 text-sm">
                  <div className="mb-1 flex flex-wrap items-center gap-2"><strong>{m.name}</strong> <a className="link text-xs" href={`mailto:${m.email}`}>{m.email}</a><Badge>{m.topic}</Badge><Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge><span className="ml-auto text-xs text-muted">{m.created_at.toISOString().slice(0, 16).replace("T", " ")}</span></div>
                  <p className="whitespace-pre-line">{m.body}</p>
                  <form action={updateMessage} className="mt-2 flex gap-2"><input type="hidden" name="id" value={m.id} />
                    <button name="status" value="read" className="btn-outline btn-sm" type="submit">Mark read</button>
                    <button name="status" value="archived" className="btn-outline btn-sm" type="submit">Archive</button>
                  </form>
                </li>
              ))}
              {!messages.length && <li className="text-sm text-muted">No messages.</li>}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
