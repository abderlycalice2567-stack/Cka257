import { json, limitPublic } from "@/lib/api";
import { isLocale, pick } from "@/lib/i18n/config";
import { onAirAndNext } from "@/modules/schedule";
import { getSetting } from "@/modules/content";
import { getEngineStatus, type NowPlayingConfig } from "@/lib/radio/now-playing";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = limitPublic(req);
  if (limited) return limited;
  const url = new URL(req.url);
  const l = url.searchParams.get("locale");
  const locale = isLocale(l) ? l : "en";
  const [{ current, upcoming }, cfg] = await Promise.all([
    onAirAndNext(),
    getSetting<NowPlayingConfig>("now_playing", { provider: "none" }),
  ]);
  const engine = await getEngineStatus(cfg);
  const next = upcoming[0];
  return json(
    {
      program: current ? { title: pick(current.program_title, locale), slug: current.program_slug, presenters: current.presenters, startsAt: current.starts_at, endsAt: current.ends_at } : null,
      next: next ? { title: pick(next.program_title, locale), slug: next.program_slug, startsAt: next.starts_at } : null,
      track: engine.track,
      liveDj: engine.liveDj,
      listeners: engine.listeners,
      online: engine.online,
      engine: engine.provider,
    },
    { cache: "public, max-age=10" },
  );
}
