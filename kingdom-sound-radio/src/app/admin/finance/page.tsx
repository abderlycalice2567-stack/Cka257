import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { pick } from "@/lib/i18n/config";
import { requirePermission } from "@/lib/auth/session";
import type { Tr } from "@/modules/catalog";
import { AdminHeader, Badge, Flash, Panel, Stat, STATUS_TONE, Table } from "@/components/admin/ui";
import { updateInquiry } from "../actions";

export const metadata = { title: "Finance" };

export default async function AdminFinance({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("finance.view");
  const [totals, donations, campaigns, inquiries] = await Promise.all([
    sql<{ total: number; recurring: number; count: number; avg: number | null; refunded: number }[]>`
      SELECT coalesce(sum(amount_cents) FILTER (WHERE status = 'succeeded'), 0)::int AS total,
             coalesce(sum(amount_cents) FILTER (WHERE status = 'succeeded' AND recurring), 0)::int AS recurring,
             count(*) FILTER (WHERE status = 'succeeded')::int AS count,
             avg(amount_cents) FILTER (WHERE status = 'succeeded')::int AS avg,
             count(*) FILTER (WHERE status = 'refunded')::int AS refunded FROM donations`,
    sql<{ id: string; amount_cents: number; currency: string; recurring: boolean; status: string; email: string | null; created_at: Date; provider_ref: string }[]>`
      SELECT id, amount_cents::int, currency, recurring, status, email, created_at, provider_ref FROM donations ORDER BY created_at DESC LIMIT 100`,
    sql<{ id: string; title: Tr; goal_cents: number | null; raised: number; active: boolean }[]>`
      SELECT c.id, c.title, c.goal_cents, c.active, coalesce((SELECT sum(amount_cents) FROM donations d WHERE d.campaign_id = c.id AND d.status = 'succeeded'), 0)::int AS raised FROM fundraising_campaigns c`,
    sql<{ id: string; name: string; organization: string; email: string; message: string; status: string; created_at: Date }[]>`
      SELECT * FROM sponsorship_inquiries ORDER BY created_at DESC LIMIT 100`,
  ]);
  const t = totals[0]!;
  const usd = (c: number) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return (
    <>
      <AdminHeader title="Finance" intro="Donations are recorded only from verified Stripe webhooks. Card details never reach this application." actions={<a className="btn-outline btn-sm" href="/api/v1/admin/donations.csv">Export CSV</a>} />
      <Flash sp={await searchParams} />
      {!env.stripeConfigured && <p className="mb-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">Stripe is not connected yet, so no donations can be received. Figures below reflect only recorded transactions.</p>}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total received" value={usd(t.total)} />
        <Stat label="From monthly partners" value={usd(t.recurring)} />
        <Stat label="Successful gifts" value={t.count} note={t.avg ? `Average ${usd(t.avg)}` : undefined} />
        <Stat label="Refunds" value={t.refunded} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent donations">
          {donations.length ? (
            <Table head={["Date", "Amount", "Type", "Status", "Donor"]}>
              {donations.map((d) => <tr key={d.id}><td className="px-3 py-2 text-xs">{d.created_at.toISOString().slice(0, 10)}</td><td className="px-3 py-2">{usd(d.amount_cents)}</td><td className="px-3 py-2">{d.recurring ? "monthly" : "one-time"}</td><td className="px-3 py-2"><Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge></td><td className="px-3 py-2 text-xs">{d.email ?? "—"}</td></tr>)}
            </Table>
          ) : <p className="text-sm text-muted">No donations recorded.</p>}
        </Panel>
        <Panel title="Campaigns">
          <ul className="space-y-2 text-sm">{campaigns.map((c) => <li key={c.id} className="flex justify-between"><span>{pick(c.title, "en")} {!c.active && <Badge>inactive</Badge>}</span><span className="text-muted">{usd(c.raised)}{c.goal_cents ? ` / ${usd(c.goal_cents)}` : ""}</span></li>)}</ul>
        </Panel>
        <Panel title="Sponsorship inquiries" className="xl:col-span-2">
          <ul className="space-y-3">
            {inquiries.map((i) => (
              <li key={i.id} className="rounded-xl border border-line p-4 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2"><strong>{i.organization}</strong> — {i.name} <a className="link text-xs" href={`mailto:${i.email}`}>{i.email}</a><Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge></div>
                <p className="whitespace-pre-line">{i.message}</p>
                <form action={updateInquiry} className="mt-2 flex gap-2"><input type="hidden" name="id" value={i.id} />
                  <button name="status" value="contacted" className="btn-outline btn-sm" type="submit">Contacted</button>
                  <button name="status" value="closed" className="btn-outline btn-sm" type="submit">Close</button>
                </form>
              </li>
            ))}
            {!inquiries.length && <li className="text-sm text-muted">No inquiries yet.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
