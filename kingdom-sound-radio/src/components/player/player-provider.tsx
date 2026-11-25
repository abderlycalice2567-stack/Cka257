"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type StreamOption = { id: string; label: string; url: string; bitrate_kbps: number };
export type EpisodeItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  audioUrl: string;
  duration: number | null;
  seed: string;
  chapters?: { start_seconds: number; title: string }[];
};
export type LiveStatus = "stopped" | "connecting" | "live" | "buffering" | "reconnecting" | "error" | "unconfigured";
export type NowPlaying = {
  program: { title: string; slug: string; presenters: string[] } | null;
  next: { title: string; startsAt: string } | null;
  track: { title: string; artist: string } | null;
  listeners: number | null;
  online: boolean | null;
  engine: "none" | "azuracast";
};

type State = {
  mode: "idle" | "live" | "episode";
  liveStatus: LiveStatus;
  streams: StreamOption[];
  streamId: string | null;
  episode: EpisodeItem | null;
  queue: EpisodeItem[];
  playing: boolean;
  position: number;
  duration: number;
  rate: number;
  volume: number;
  muted: boolean;
  sleepAt: number | null;
  sleepMinutes: number | null;
  expanded: boolean;
  nowPlaying: NowPlaying | null;
  signedIn: boolean;
};

type Api = State & {
  playLive: () => void;
  stop: () => void;
  togglePlay: () => void;
  playEpisode: (ep: EpisodeItem, startAt?: number) => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  setRate: (r: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setStream: (id: string) => void;
  enqueue: (ep: EpisodeItem) => void;
  clearQueue: () => void;
  next: () => void;
  prev: () => void;
  setSleep: (minutes: number | null) => void;
  setExpanded: (v: boolean) => void;
};

const Ctx = createContext<Api | null>(null);

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return c;
}

const RETRY_DELAYS = [2000, 4000, 8000, 15000, 30000];
const store = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* storage unavailable (private mode) — non-essential */
    }
  },
};

export function PlayerProvider({
  children,
  streams,
  locale,
  signedIn,
}: {
  children: ReactNode;
  streams: StreamOption[];
  locale: string;
  signedIn: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryRef = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(0);
  const historyLogged = useRef<string | null>(null);
  // Lets the "ended" handler (wired once) start the next queued episode.
  const playEpisodeRef = useRef<(ep: EpisodeItem, startAt?: number) => void>(() => {});

  const [s, setS] = useState<State>(() => ({
    mode: "idle",
    liveStatus: streams.length ? "stopped" : "unconfigured",
    streams,
    streamId: streams[0]?.id ?? null,
    episode: null,
    queue: [],
    playing: false,
    position: 0,
    duration: 0,
    rate: 1,
    volume: 0.9,
    muted: false,
    sleepAt: null,
    sleepMinutes: null,
    expanded: false,
    nowPlaying: null,
    signedIn,
  }));
  const sRef = useRef(s);
  useEffect(() => {
    sRef.current = s;
  });
  const patch = useCallback((p: Partial<State>) => setS((prev) => ({ ...prev, ...p })), []);

  // Restore preferences and the last selected content (paused — never autoplay).
  useEffect(() => {
    const prefs = store.get<{ volume?: number; rate?: number; streamId?: string }>("ksr_player_prefs", {});
    const last = store.get<{ mode: "live" | "episode"; episode?: EpisodeItem; position?: number } | null>("ksr_player_last", null);
    const q = store.get<EpisodeItem[]>("ksr_player_queue", []);
    // localStorage is only readable after hydration, so this one-time restore must run in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS((prev) => ({
      ...prev,
      volume: prefs.volume ?? prev.volume,
      rate: prefs.rate ?? prev.rate,
      streamId: prev.streams.some((x) => x.id === prefs.streamId) ? prefs.streamId! : prev.streamId,
      queue: q,
      ...(last?.mode === "episode" && last.episode
        ? { mode: "episode", episode: last.episode, position: last.position ?? 0, duration: last.episode.duration ?? 0 }
        : last?.mode === "live" && prev.streams.length
          ? { mode: "live" }
          : {}),
    }));
  }, []);

  useEffect(() => {
    store.set("ksr_player_prefs", { volume: s.volume, rate: s.rate, streamId: s.streamId });
  }, [s.volume, s.rate, s.streamId]);
  useEffect(() => store.set("ksr_player_queue", s.queue), [s.queue]);

  const currentStream = useCallback(() => {
    const st = sRef.current;
    return st.streams.find((x) => x.id === st.streamId) ?? st.streams[0] ?? null;
  }, []);

  const clearRetry = () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
  };

  const logHistory = useCallback((kind: "live" | "episode", episodeId?: string) => {
    if (!sRef.current.signedIn) return;
    const key = kind + (episodeId ?? "");
    if (historyLogged.current === key) return;
    historyLogged.current = key;
    void fetch("/api/v1/listening/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, episodeId }),
    }).catch(() => {});
  }, []);

  const saveProgress = useCallback((force = false) => {
    const st = sRef.current;
    const a = audioRef.current;
    if (st.mode !== "episode" || !st.episode || !a) return;
    const now = Date.now();
    if (!force && now - lastSaved.current < 15000) return;
    lastSaved.current = now;
    const position = Math.floor(a.currentTime);
    const completed = !!a.duration && position >= a.duration - 5;
    store.set(`ksr_progress_${st.episode.id}`, completed ? 0 : position);
    store.set("ksr_player_last", { mode: "episode", episode: st.episode, position });
    if (st.signedIn) {
      void fetch("/api/v1/listening/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: st.episode.id, position, completed }),
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  const startLive = useCallback(
    (isRetry = false) => {
      const a = audioRef.current;
      const stream = currentStream();
      if (!a) return;
      if (!stream) {
        patch({ mode: "live", liveStatus: "unconfigured", playing: false });
        return;
      }
      clearRetry();
      if (!isRetry) retryRef.current = 0;
      patch({ mode: "live", liveStatus: isRetry ? "reconnecting" : "connecting", episode: sRef.current.episode });
      // Cache-bust so a reconnect never resumes a stale buffer.
      a.src = `${stream.url}${stream.url.includes("?") ? "&" : "?"}_=${Date.now()}`;
      a.playbackRate = 1;
      a.play().catch(() => {
        patch({ liveStatus: "error", playing: false });
      });
      store.set("ksr_player_last", { mode: "live" });
    },
    [currentStream, patch],
  );

  const scheduleReconnect = useCallback(() => {
    const st = sRef.current;
    if (st.mode !== "live" || st.liveStatus === "stopped") return;
    const attempt = retryRef.current;
    if (attempt >= RETRY_DELAYS.length) {
      patch({ liveStatus: "error", playing: false });
      return;
    }
    retryRef.current += 1;
    patch({ liveStatus: "reconnecting", playing: false });
    retryTimer.current = setTimeout(() => startLive(true), RETRY_DELAYS[attempt]);
  }, [patch, startLive]);

  // Wire audio element events once.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlaying = () => {
      const st = sRef.current;
      retryRef.current = 0;
      if (st.mode === "live") {
        patch({ liveStatus: "live", playing: true });
        logHistory("live");
      } else {
        patch({ playing: true });
        if (st.episode) logHistory("episode", st.episode.id);
      }
    };
    const onPause = () => {
      patch({ playing: false });
      saveProgress(true);
    };
    const onWaiting = () => {
      if (sRef.current.mode === "live" && sRef.current.liveStatus === "live") patch({ liveStatus: "buffering" });
    };
    const onError = () => {
      if (sRef.current.mode === "live") scheduleReconnect();
      else patch({ playing: false });
    };
    const onTime = () => {
      patch({ position: a.currentTime, duration: Number.isFinite(a.duration) ? a.duration : sRef.current.duration });
      saveProgress();
    };
    const onEnded = () => {
      const st = sRef.current;
      if (st.mode === "live") {
        scheduleReconnect();
        return;
      }
      saveProgress(true);
      const [nextEp, ...rest] = st.queue;
      if (nextEp) {
        patch({ queue: rest });
        playEpisodeRef.current(nextEp);
      } else patch({ playing: false });
    };
    a.addEventListener("playing", onPlaying);
    a.addEventListener("pause", onPause);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("stalled", onWaiting);
    a.addEventListener("error", onError);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("stalled", onWaiting);
      a.removeEventListener("error", onError);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
    };
  }, [patch, saveProgress, scheduleReconnect, logHistory]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = s.volume;
    a.muted = s.muted;
  }, [s.volume, s.muted]);

  useEffect(() => {
    const a = audioRef.current;
    if (a && s.mode === "episode") a.playbackRate = s.rate;
  }, [s.rate, s.mode]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    clearRetry();
    if (!a) return;
    if (sRef.current.mode === "live") {
      a.pause();
      a.removeAttribute("src"); // stop downloading the stream
      a.load();
      patch({ liveStatus: "stopped", playing: false });
    } else {
      a.pause();
    }
  }, [patch]);

  const playEpisode = useCallback(
    (ep: EpisodeItem, startAt?: number) => {
      const a = audioRef.current;
      if (!a) return;
      clearRetry();
      saveProgress(true);
      const resume = startAt ?? store.get<number>(`ksr_progress_${ep.id}`, 0);
      patch({ mode: "episode", episode: ep, position: resume, duration: ep.duration ?? 0, liveStatus: sRef.current.streams.length ? "stopped" : "unconfigured" });
      a.src = ep.audioUrl;
      a.playbackRate = sRef.current.rate;
      // play() must be called synchronously inside the user's click (autoplay rules);
      // with preload="none" metadata only arrives after play starts, so seek then.
      if (resume > 0) {
        a.addEventListener(
          "loadedmetadata",
          () => {
            if (!a.duration || resume < a.duration - 5) a.currentTime = resume;
          },
          { once: true },
        );
      }
      a.play().catch(() => patch({ playing: false }));
      store.set("ksr_player_last", { mode: "episode", episode: ep, position: resume });
    },
    [patch, saveProgress],
  );
  useEffect(() => {
    playEpisodeRef.current = playEpisode;
  }, [playEpisode]);

  const togglePlay = useCallback(() => {
    const st = sRef.current;
    const a = audioRef.current;
    if (!a) return;
    if (st.mode === "live" || st.mode === "idle") {
      if (st.playing || st.liveStatus === "connecting" || st.liveStatus === "reconnecting") stop();
      else startLive();
      return;
    }
    if (st.episode && !a.src) {
      playEpisode(st.episode, st.position);
      return;
    }
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [playEpisode, startLive, stop]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a || sRef.current.mode !== "episode") return;
    a.currentTime = Math.max(0, Math.min(t, a.duration || t));
  }, []);

  const api = useMemo<Api>(
    () => ({
      ...s,
      playLive: () => startLive(),
      stop,
      togglePlay,
      playEpisode,
      seek,
      skip: (d) => seek((audioRef.current?.currentTime ?? 0) + d),
      setRate: (r) => patch({ rate: Math.min(2, Math.max(0.75, r)) }),
      setVolume: (v) => patch({ volume: Math.min(1, Math.max(0, v)), muted: v === 0 }),
      toggleMute: () => patch({ muted: !sRef.current.muted }),
      setStream: (id) => {
        patch({ streamId: id });
        if (sRef.current.mode === "live" && sRef.current.playing) setTimeout(() => startLive(), 0);
      },
      enqueue: (ep) => patch({ queue: [...sRef.current.queue.filter((q) => q.id !== ep.id), ep] }),
      clearQueue: () => patch({ queue: [] }),
      next: () => {
        const [n, ...rest] = sRef.current.queue;
        if (n) {
          patch({ queue: rest });
          playEpisode(n);
        }
      },
      prev: () => seek(0),
      setSleep: (m) => patch({ sleepAt: m ? Date.now() + m * 60000 : null, sleepMinutes: m }),
      setExpanded: (v) => patch({ expanded: v }),
    }),
    [s, startLive, stop, togglePlay, playEpisode, seek, patch],
  );

  // Sleep timer.
  useEffect(() => {
    if (!s.sleepAt) return;
    const ms = s.sleepAt - Date.now();
    const t = setTimeout(() => {
      stop();
      patch({ sleepAt: null, sleepMinutes: null });
    }, Math.max(0, ms));
    return () => clearTimeout(t);
  }, [s.sleepAt, stop, patch]);

  // Live metadata polling (program from our schedule; track/listeners from the engine).
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/v1/radio/now-playing?locale=${locale}`, { cache: "no-store" });
        if (r.ok && alive) patch({ nowPlaying: (await r.json()) as NowPlaying });
      } catch {
        /* offline — keep last known metadata */
      }
    };
    void load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [locale, patch]);

  // Lock-screen / OS media controls.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const title = s.mode === "episode" ? s.episode?.title : s.nowPlaying?.track?.title || s.nowPlaying?.program?.title || "The Kingdom Sound Radio";
    const artist = s.mode === "episode" ? s.episode?.subtitle : s.nowPlaying?.track?.artist || "The Kingdom Sound Radio";
    ms.metadata = new MediaMetadata({ title: title ?? "", artist: artist ?? "", album: "The Kingdom Sound Radio", artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }] });
    ms.setActionHandler("play", () => togglePlay());
    ms.setActionHandler("pause", () => togglePlay());
    ms.setActionHandler("stop", () => stop());
    if (s.mode === "episode") {
      ms.setActionHandler("seekbackward", () => api.skip(-15));
      ms.setActionHandler("seekforward", () => api.skip(30));
      ms.setActionHandler("nexttrack", s.queue.length ? () => api.next() : null);
    } else {
      ms.setActionHandler("seekbackward", null);
      ms.setActionHandler("seekforward", null);
      ms.setActionHandler("nexttrack", null);
    }
  }, [s.mode, s.episode, s.nowPlaying, s.queue.length, togglePlay, stop, api]);

  useEffect(() => {
    const flush = () => saveProgress(true);
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [saveProgress]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {/* The single audio element for the whole site: only one stream can ever play. */}
      <audio ref={audioRef} preload="none" className="hidden" />
    </Ctx.Provider>
  );
}
