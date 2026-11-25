import { json, limitPublic } from "@/lib/api";
import { getSetting, getStreams } from "@/modules/content";
import { getEngineStatus, type NowPlayingConfig } from "@/lib/radio/now-playing";

export const dynamic = "force-dynamic";

/** Stream configuration + engine health. Never reports "online" without an engine saying so. */
export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const [streams, cfg] = await Promise.all([getStreams(), getSetting<NowPlayingConfig>("now_playing", { provider: "none" })]);
  const engine = await getEngineStatus(cfg);
  return json(
    {
      configured: streams.length > 0,
      streams: streams.map((s) => ({ label: s.label, url: s.url, bitrateKbps: s.bitrate_kbps, format: s.format, default: s.is_default })),
      engine: { provider: engine.provider, reachable: engine.reachable, online: engine.online, listeners: engine.listeners },
    },
    { cache: "public, max-age=10" },
  );
}
