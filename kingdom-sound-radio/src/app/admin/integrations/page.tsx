import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { requirePermission } from "@/lib/auth/session";
import { AdminHeader, Badge, Check, Flash, Panel } from "@/components/admin/ui";
import { saveIntegration, verifyIntegration } from "../actions";

export const metadata = { title: "Integrations" };

const HELP: Record<string, string> = {
  podcast: "Submit the program's RSS feed (shown on each program page) to the platform, then paste the public show URL here.",
  live_directory: "Submit the station's HTTPS stream URL, artwork and description. Acceptance is decided by each directory.",
  video: "Paste the channel or playlist URL. Live video is streamed from OBS to YouTube via RTMPS — not through this website.",
  social: "Public profile URL.",
};

export default async function AdminIntegrations({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("integrations.manage");
  const rows = await sql<{ key: string; name: string; kind: string; url: string | null; identifier: string | null; enabled: boolean; verified_at: Date | null; last_error: string | null }[]>`
    SELECT key, name, kind, url, identifier, enabled, verified_at, last_error FROM platform_integrations ORDER BY sort`;
  const kinds = ["podcast", "live_directory", "video", "social"];
  return (
    <>
      <AdminHeader title="Integrations" intro="An integration appears on the public site only when it is enabled AND a staff member has tested the link and marked it verified. Nothing is shown as connected by default." />
      <Flash sp={await searchParams} />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Panel title="Podcast feeds"><p className="text-sm">All programs: <a className="link font-mono text-xs" href="/feeds/podcasts.xml">{env.appUrl}/feeds/podcasts.xml</a></p><p className="mt-2 text-xs text-muted">Per-program feeds: /feeds/podcasts/&lt;program&gt;.xml (enable on each program). Validate with a podcast feed validator before submitting.</p></Panel>
        <Panel title="Email (Resend)"><Badge tone={env.emailConfigured ? "ok" : "muted"}>{env.emailConfigured ? "Configured" : "Not configured"}</Badge><p className="mt-2 text-xs text-muted">Set RESEND_API_KEY and EMAIL_FROM in the hosting environment.</p></Panel>
        <Panel title="Payments (Stripe)"><Badge tone={env.stripeConfigured ? "ok" : "muted"}>{env.stripeConfigured ? "Configured" : "Not configured"}</Badge><p className="mt-2 text-xs text-muted">Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET; webhook URL: /api/v1/webhooks/payments</p></Panel>
      </div>
      {kinds.map((k) => (
        <Panel key={k} title={k.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())} className="mb-6">
          <p className="mb-4 text-xs text-muted">{HELP[k]}</p>
          <ul className="divide-y divide-line">
            {rows.filter((r) => r.kind === k).map((r) => (
              <li key={r.key} className="grid gap-3 py-3 md:grid-cols-[160px_1fr_auto] md:items-center">
                <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{r.name}</strong>
                  {r.enabled && r.verified_at ? <Badge tone="ok">live</Badge> : r.enabled ? <Badge tone="gold">untested</Badge> : <Badge>off</Badge>}
                </div>
                <form action={saveIntegration} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="key" value={r.key} />
                  <input name="url" defaultValue={r.url ?? ""} placeholder="https://" className="input !w-full !py-1.5 md:!w-80" />
                  <input name="identifier" defaultValue={r.identifier ?? ""} placeholder="ID (optional)" className="input !w-36 !py-1.5" />
                  <Check name="enabled" label="Enabled" defaultChecked={r.enabled} />
                  <button className="btn-outline btn-sm" type="submit">Save</button>
                </form>
                <form action={verifyIntegration}>
                  <input type="hidden" name="key" value={r.key} />
                  {r.verified_at ? (
                    <button name="op" value="unverify" className="btn-outline btn-sm" type="submit" title={`Verified ${r.verified_at.toISOString().slice(0, 10)}`}>Unverify</button>
                  ) : (
                    <button name="op" value="verify" className="btn-gold btn-sm" type="submit" disabled={!r.url}>I tested it</button>
                  )}
                </form>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </>
  );
}
