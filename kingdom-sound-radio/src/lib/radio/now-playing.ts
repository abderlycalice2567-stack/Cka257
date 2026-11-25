import "server-only";

/**
 * Broadcasting-engine adapter. The website asks "is the station online, how
 * many listeners, what's the current track" through this interface so the
 * engine (AzuraCast today) can be swapped without touching the UI.
 */
export type EngineStatus = {
  provider: "none" | "azuracast";
  reachable: boolean;
  online: boolean | null; // null = unknown (no engine connected)
  listeners: number | null;
  track: { title: string; artist: string } | null;
  liveDj: string | null;
  error?: string;
};

export type NowPlayingConfig = { provider: "none" | "azuracast"; baseUrl?: string; stationShortcode?: string };

let cache: { at: number; key: string; value: EngineStatus } | null = null;

export async function getEngineStatus(cfg: NowPlayingConfig): Promise<EngineStatus> {
  if (cfg.provider !== "azuracast" || !cfg.baseUrl || !cfg.stationShortcode) {
    return { provider: "none", reachable: false, online: null, listeners: null, track: null, liveDj: null };
  }
  const key = `${cfg.baseUrl}|${cfg.stationShortcode}`;
  if (cache && cache.key === key && Date.now() - cache.at < 15000) return cache.value;

  let value: EngineStatus;
  try {
    const url = `${cfg.baseUrl.replace(/\/$/, "")}/api/nowplaying/${encodeURIComponent(cfg.stationShortcode)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as {
      is_online?: boolean;
      listeners?: { current?: number };
      now_playing?: { song?: { title?: string; artist?: string } };
      live?: { is_live?: boolean; streamer_name?: string };
    };
    value = {
      provider: "azuracast",
      reachable: true,
      online: !!j.is_online,
      listeners: typeof j.listeners?.current === "number" ? j.listeners.current : null,
      track: j.now_playing?.song?.title
        ? { title: j.now_playing.song.title, artist: j.now_playing.song.artist ?? "" }
        : null,
      liveDj: j.live?.is_live ? j.live.streamer_name || null : null,
    };
  } catch (e) {
    value = {
      provider: "azuracast",
      reachable: false,
      online: null,
      listeners: null,
      track: null,
      liveDj: null,
      error: e instanceof Error ? e.message : "unreachable",
    };
  }
  cache = { at: Date.now(), key, value };
  return value;
}
