import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getEngineStatus, type NowPlayingConfig } from "@/lib/radio/now-playing";
import { getSetting } from "@/modules/content";
import { AdminHeader, Badge, Flash, Panel } from "@/components/admin/ui";
import { purgeSampleContent } from "../actions";

export const metadata = { title: "Launch readiness" };

type Item = { label: string; state: "done" | "todo" | "manual"; detail?: string };

export default async function LaunchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await requirePermission("admin.access");
  const [c] = await sql<{ streams: number; samples: number; samplePages: number; published: number; feeds: number; integrations: number; staffNoMfa: number; schedules: number }[]>`
    SELECT (SELECT count(*)::int FROM stream_endpoints WHERE enabled) AS streams,
           (SELECT (SELECT count(*) FROM programs WHERE is_sample) + (SELECT count(*) FROM episodes WHERE is_sample) + (SELECT count(*) FROM presenters WHERE is_sample)
                 + (SELECT count(*) FROM articles WHERE is_sample) + (SELECT count(*) FROM events WHERE is_sample) + (SELECT count(*) FROM devotionals WHERE is_sample))::int AS samples,
           (SELECT count(*)::int FROM pages WHERE is_sample) AS "samplePages",
           (SELECT count(*)::int FROM episodes WHERE status = 'published' AND NOT is_sample) AS published,
           (SELECT count(*)::int FROM programs WHERE podcast_enabled AND status = 'published' AND NOT is_sample) AS feeds,
           (SELECT count(*)::int FROM platform_integrations WHERE enabled AND verified_at IS NOT NULL) AS integrations,
           (SELECT count(DISTINCT u.id)::int FROM users u JOIN user_roles r ON r.user_id = u.id JOIN roles ro ON ro.key = r.role_key AND ro.is_staff WHERE u.totp_enabled_at IS NULL AND u.status = 'active') AS "staffNoMfa",
           (SELECT count(*)::int FROM broadcast_schedules WHERE active) AS schedules`;
  const engine = await getEngineStatus(await getSetting<NowPlayingConfig>("now_playing", { provider: "none" }));
  const items: Item[] = [
    { label: "Live HTTPS stream configured", state: c!.streams ? "done" : "todo", detail: `${c!.streams} enabled endpoint(s)` },
    { label: "Broadcasting engine connected and reporting online", state: engine.online ? "done" : "todo", detail: engine.provider === "none" ? "AzuraCast not connected" : engine.error ?? (engine.online ? "online" : "offline") },
    { label: "AutoDJ takes over when a presenter disconnects", state: "manual", detail: "Test in AzuraCast: disconnect a live source and confirm fallback audio" },
    { label: "Weekly schedule entered", state: c!.schedules ? "done" : "todo", detail: `${c!.schedules} active rule(s)` },
    { label: "Real episodes published (not sample)", state: c!.published ? "done" : "todo", detail: `${c!.published} published` },
    { label: "Podcast feeds enabled on real programs", state: c!.feeds ? "done" : "todo", detail: "Validate each feed before submitting to Apple/Spotify" },
    { label: "External platforms configured and tested", state: c!.integrations ? "done" : "todo", detail: `${c!.integrations} live` },
    { label: "Transactional email (verification, reset, reminders)", state: env.emailConfigured ? "done" : "todo", detail: "RESEND_API_KEY" },
    { label: "Payments and webhook", state: env.stripeConfigured && process.env.STRIPE_WEBHOOK_SECRET ? "manual" : "todo", detail: "Run a live test donation and refund" },
    { label: "All staff accounts use two-step verification", state: c!.staffNoMfa === 0 ? "done" : "todo", detail: `${c!.staffNoMfa} staff without 2-step` },
    { label: "Site indexing enabled for production", state: env.allowIndexing ? "done" : "todo", detail: "Set ALLOW_INDEXING=true only at launch" },
    { label: "Sample content removed", state: c!.samples === 0 ? "done" : "todo", detail: `${c!.samples} sample records` },
    { label: "Legal/template pages reviewed (privacy, terms, accessibility…)", state: c!.samplePages === 0 ? "done" : "todo", detail: `${c!.samplePages} page(s) still templates` },
    { label: "Music licensing & podcast redistribution rights confirmed", state: "manual", detail: "SoundExchange / ASCAP / BMI / SESAC / GMR or direct agreements as applicable" },
    { label: "Accessibility audit (WCAG 2.2 AA) completed", state: "manual" },
    { label: "Performance test (Core Web Vitals) completed", state: "manual" },
    { label: "Streaming load test completed", state: "manual" },
    { label: "Backup restore tested", state: "manual", detail: "See docs/OPERATIONS.md" },
    { label: "Haitian Creole and French copy reviewed by native speakers", state: "manual" },
  ];
  const tone = { done: "ok", todo: "warn", manual: "gold" } as const;
  const label = { done: "Done", todo: "To do", manual: "Confirm manually" };
  return (
    <>
      <AdminHeader title="Launch readiness" intro="Automatic checks read the live configuration; items marked “confirm manually” cannot be verified by software and need a person to sign off." />
      <Flash sp={await searchParams} />
      <Panel>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.label} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span>{i.label}{i.detail && <span className="block text-xs text-muted">{i.detail}</span>}</span>
              <Badge tone={tone[i.state]}>{label[i.state]}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
      {hasPermission(u.permissions, "sample.purge") && c!.samples > 0 && (
        <Panel title="Remove sample content" className="mt-6">
          <p className="text-sm text-muted">Deletes every record marked as sample (programs, episodes and their test audio, presenters, articles, devotionals, events). Schedules attached to sample programs are removed with them. Template pages are kept. This cannot be undone.</p>
          <form action={purgeSampleContent} className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block"><span className="label">Type REMOVE SAMPLE CONTENT</span><input name="confirm" className="input !w-72" autoComplete="off" /></label>
            <button className="btn-live btn-sm h-[42px]" type="submit">Remove sample content</button>
          </form>
        </Panel>
      )}
    </>
  );
}
