import Link from "next/link";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { pick } from "@/lib/i18n/config";
import { requirePermission } from "@/lib/auth/session";
import { getEngineStatus, type NowPlayingConfig } from "@/lib/radio/now-playing";
import { onAirAndNext } from "@/modules/schedule";
import { getSetting, getStation, getStreams } from "@/modules/content";
import { AdminHeader, Badge, Panel, Stat } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  await requirePermission("admin.access");
  const [station, streams, cfg, { current, upcoming }, counts, recent] = await Promise.all([
    getStation(),
    getStreams(),
    getSetting<NowPlayingConfig>("now_playing", { provider: "none" }),
    onAirAndNext(),
    sql<{ subscribers: number; new7: number; awaiting: number; processing: number; prayers: number; testimonies: number; messages: number; donations: number; donated: number; integrations: number; samples: number }[]>`
      SELECT
        (SELECT count(*)::int FROM user_roles WHERE role_key = 'subscriber') AS subscribers,
        (SELECT count(*)::int FROM users WHERE created_at > now() - interval '7 days') AS new7,
        (SELECT count(*)::int FROM episodes WHERE status = 'awaiting_review') AS awaiting,
        (SELECT count(*)::int FROM episodes WHERE status IN ('processing','failed')) AS processing,
        (SELECT count(*)::int FROM prayer_requests WHERE status = 'pending') AS prayers,
        (SELECT count(*)::int FROM testimonies WHERE status = 'pending') AS testimonies,
        (SELECT count(*)::int FROM contact_messages WHERE status = 'new') AS messages,
        (SELECT count(*)::int FROM donations WHERE status = 'succeeded') AS donations,
        (SELECT coalesce(sum(amount_cents), 0)::int FROM donations WHERE status = 'succeeded') AS donated,
        (SELECT count(*)::int FROM platform_integrations WHERE enabled AND verified_at IS NOT NULL) AS integrations,
        (SELECT (SELECT count(*) FROM programs WHERE is_sample) + (SELECT count(*) FROM episodes WHERE is_sample) + (SELECT count(*) FROM presenters WHERE is_sample))::int AS samples`,
    sql<{ id: string; title: string; published_at: Date; program: unknown }[]>`
      SELECT e.id, e.title, e.published_at, p.title AS program FROM episodes e JOIN programs p ON p.id = e.program_id
       WHERE e.status = 'published' ORDER BY e.published_at DESC LIMIT 5`,
  ]);
  const c = counts[0]!;
  const engine = await getEngineStatus(cfg);

  const alerts: { tone: "warn" | "gold"; text: string; href: string }[] = [];
  if (!streams.length) alerts.push({ tone: "warn", text: "No live stream configured — the site player shows \"Stream not configured\".", href: "/admin/station" });
  if (engine.provider === "none") alerts.push({ tone: "gold", text: "Broadcasting engine (AzuraCast) not connected — listener counts and song metadata are unavailable.", href: "/admin/station" });
  if (engine.provider !== "none" && !engine.reachable) alerts.push({ tone: "warn", text: `Broadcasting engine unreachable: ${engine.error ?? "no response"}.`, href: "/admin/station" });
  if (engine.online === false) alerts.push({ tone: "warn", text: "The broadcasting engine reports the station OFFLINE.", href: "/admin/station" });
  if (!env.emailConfigured) alerts.push({ tone: "gold", text: "Email delivery not configured — verification, reset and reminder emails are not sent.", href: "/admin/launch" });
  if (!env.stripeConfigured) alerts.push({ tone: "gold", text: "Online giving not connected (Stripe).", href: "/admin/launch" });
  if (c.samples > 0) alerts.push({ tone: "gold", text: `${c.samples} sample records are still in the database.`, href: "/admin/launch" });

  return (
    <>
      <AdminHeader title="Dashboard" intro={`${station.name} · station time zone ${station.timezone}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Stream" value={streams.length ? `${streams.length} endpoint${streams.length > 1 ? "s" : ""}` : "Not configured"} tone={streams.length ? "ok" : "warn"} note={engine.online === true ? "Engine: online" : engine.online === false ? "Engine: offline" : "Engine status unknown"} />
        <Stat label="Current listeners" value={engine.listeners ?? "—"} note={engine.listeners === null ? "Available once AzuraCast is connected" : "Reported by AzuraCast"} />
        <Stat label="Registered subscribers" value={c.subscribers} note={`${c.new7} new accounts in the last 7 days`} />
        <Stat label="Donations received" value={c.donations ? (c.donated / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—"} note={env.stripeConfigured ? `${c.donations} successful` : "Payments not connected"} />
      </div>

      {alerts.length > 0 && (
        <Panel title="System alerts" className="mt-6">
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.text} className="flex items-start justify-between gap-3 text-sm">
                <span className="flex items-start gap-2"><Badge tone={a.tone}>{a.tone === "warn" ? "Action" : "Setup"}</Badge> {a.text}</span>
                <Link href={a.href} className="shrink-0 text-xs link">Open</Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="On air (from schedule)">
          {current ? (
            <p className="text-sm"><strong>{pick(current.program_title, "en")}</strong><br /><span className="text-muted">until {current.ends_at.toISOString().slice(11, 16)} UTC</span></p>
          ) : <p className="text-sm text-muted">Automated rotation (no scheduled program).</p>}
          {engine.track && <p className="mt-2 text-sm">Now playing: {engine.track.title} — {engine.track.artist}</p>}
          <h3 className="mb-2 mt-5 text-xs font-semibold uppercase text-muted">Up next</h3>
          <ul className="space-y-1 text-sm">
            {upcoming.slice(0, 4).map((o) => <li key={o.id} className="flex justify-between gap-2"><span>{pick(o.program_title, "en")}</span><span className="text-muted">{o.starts_at.toISOString().slice(5, 16).replace("T", " ")} UTC</span></li>)}
          </ul>
        </Panel>
        <Panel title="Needs attention">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><Link className="link" href="/admin/episodes?status=awaiting_review">Episodes awaiting review</Link><Badge tone={c.awaiting ? "gold" : "muted"}>{c.awaiting}</Badge></li>
            <li className="flex justify-between"><Link className="link" href="/admin/episodes?status=processing">Processing / failed</Link><Badge tone={c.processing ? "warn" : "muted"}>{c.processing}</Badge></li>
            <li className="flex justify-between"><Link className="link" href="/admin/community">Prayer requests pending</Link><Badge tone={c.prayers ? "gold" : "muted"}>{c.prayers}</Badge></li>
            <li className="flex justify-between"><Link className="link" href="/admin/community">Testimonies pending</Link><Badge tone={c.testimonies ? "gold" : "muted"}>{c.testimonies}</Badge></li>
            <li className="flex justify-between"><Link className="link" href="/admin/community">New contact messages</Link><Badge tone={c.messages ? "gold" : "muted"}>{c.messages}</Badge></li>
            <li className="flex justify-between"><Link className="link" href="/admin/integrations">Live integrations</Link><Badge>{c.integrations}</Badge></li>
          </ul>
        </Panel>
        <Panel title="Recently published">
          <ul className="space-y-2 text-sm">
            {recent.map((r) => (
              <li key={r.id}><Link className="link" href={`/admin/episodes/${r.id}`}>{r.title}</Link><span className="block text-xs text-muted">{pick(r.program, "en")} · {r.published_at.toISOString().slice(0, 10)}</span></li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
