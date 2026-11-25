import { sql } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { getEngineStatus, type NowPlayingConfig } from "@/lib/radio/now-playing";
import { getSetting, getStation } from "@/modules/content";
import { AdminHeader, Badge, Flash, Input, Panel, Table, TrFields } from "@/components/admin/ui";
import { addStream, saveNowPlaying, saveStation, updateStream } from "../actions";

export const metadata = { title: "Broadcasting" };

export default async function StationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePermission("station.manage");
  const [station, streams, cfg] = await Promise.all([
    getStation(),
    sql<{ id: string; label: string; url: string; bitrate_kbps: number; format: string; is_default: boolean; enabled: boolean }[]>`
      SELECT id, label, url, bitrate_kbps, format, is_default, enabled FROM stream_endpoints ORDER BY is_default DESC, sort, bitrate_kbps DESC`,
    getSetting<NowPlayingConfig>("now_playing", { provider: "none" }),
  ]);
  const engine = await getEngineStatus(cfg);
  return (
    <>
      <AdminHeader title="Broadcasting" intro="Stream endpoints, the broadcasting-engine connection and station settings. The radio itself runs on separate infrastructure (AzuraCast/Icecast), so website maintenance never interrupts the broadcast." />
      <Flash sp={await searchParams} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Live stream endpoints">
          {streams.length ? (
            <Table head={["Label", "URL", "kbps", "", ""]}>
              {streams.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2">{s.label} {s.is_default && <Badge tone="gold">default</Badge>} {!s.enabled && <Badge tone="warn">disabled</Badge>}</td>
                  <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs">{s.url}</td>
                  <td className="px-3 py-2">{s.bitrate_kbps}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {(["default", "toggle", "delete"] as const).map((op) => (
                        <form key={op} action={updateStream}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="op" value={op} />
                          <button className={`btn-outline btn-sm ${op === "delete" ? "text-live" : ""}`} type="submit">{op === "toggle" ? (s.enabled ? "Disable" : "Enable") : op === "default" ? "Make default" : "Delete"}</button>
                        </form>
                      ))}
                    </div>
                  </td>
                  <td />
                </tr>
              ))}
            </Table>
          ) : <p className="text-sm text-muted">No stream yet. Add the HTTPS mount URL(s) from AzuraCast/Icecast (or the station&apos;s current provider). Offer ~64 kbps (low data), ~128 kbps (standard) and ~192 kbps (high).</p>}
          <form action={addStream} className="mt-5 grid gap-3 border-t border-line pt-5 md:grid-cols-[1fr_2fr_100px_90px_auto] md:items-end">
            <Input name="label" label="Label" placeholder="Standard" />
            <Input name="url" label="HTTPS stream URL" required placeholder="https://stream.example.org/radio/8000/standard.mp3" />
            <Input name="bitrate_kbps" label="kbps" type="number" defaultValue={128} />
            <label className="block"><span className="label">Format</span><select name="format" className="input"><option>mp3</option><option>aac</option><option>ogg</option></select></label>
            <button className="btn-gold btn-sm h-[42px]" type="submit">Add</button>
          </form>
        </Panel>

        <Panel title="Broadcasting engine (now playing, listeners)" actions={<Badge tone={engine.online ? "ok" : engine.provider === "none" ? "muted" : "warn"}>{engine.provider === "none" ? "Not connected" : engine.reachable ? (engine.online ? "Online" : "Offline") : "Unreachable"}</Badge>}>
          <form action={saveNowPlaying} className="space-y-3">
            <label className="block"><span className="label">Provider</span>
              <select name="provider" defaultValue={cfg.provider} className="input"><option value="none">None</option><option value="azuracast">AzuraCast</option></select>
            </label>
            <Input name="baseUrl" label="AzuraCast base URL" defaultValue={cfg.baseUrl} placeholder="https://studio.thekingdomsoundradio.com" />
            <Input name="stationShortcode" label="Station short name" defaultValue={cfg.stationShortcode} placeholder="kingdom_sound" />
            <button className="btn-gold btn-sm" type="submit">Save connection</button>
          </form>
          {engine.provider !== "none" && (
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted">Listeners</dt><dd>{engine.listeners ?? "—"}</dd>
              <dt className="text-muted">Live presenter</dt><dd>{engine.liveDj ?? "—"}</dd>
              <dt className="text-muted">Track</dt><dd>{engine.track ? `${engine.track.title} — ${engine.track.artist}` : "—"}</dd>
              {engine.error && <><dt className="text-muted">Error</dt><dd className="text-live">{engine.error}</dd></>}
            </dl>
          )}
          <p className="mt-4 text-xs text-muted">The site reads AzuraCast&apos;s public now-playing API server-side every 15 seconds at most. Presenter credentials, AutoDJ, fallback, recordings and jingles are managed inside AzuraCast.</p>
        </Panel>

        <Panel title="Station settings" className="xl:col-span-2">
          <form action={saveStation} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input name="name" label="Station name" defaultValue={station.name} required />
              <Input name="timezone" label="Time zone (IANA)" defaultValue={station.timezone} required hint="e.g. America/New_York — schedules are written in this zone" />
              <Input name="contact_email" label="Public contact email" type="email" defaultValue={station.contact_email} />
            </div>
            <TrFields name="tagline" label="Tagline" value={station.tagline} />
            <button className="btn-gold btn-sm" type="submit">Save settings</button>
          </form>
        </Panel>
      </div>
    </>
  );
}
