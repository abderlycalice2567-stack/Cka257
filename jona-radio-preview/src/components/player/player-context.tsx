"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "error" | "offline";

type PlayerContextValue = {
  state: PlayerState;
  statusLabel: string;
  isLive: boolean;
  nowPlaying: string | null;
  volume: number;
  muted: boolean;
  hasStream: boolean;
  play: () => void;
  stop: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const STATUS: Record<PlayerState, string> = {
  idle: "Prêt à écouter",
  loading: "Connexion…",
  playing: "En direct",
  paused: "En pause",
  error: "Flux indisponible — réessayez",
  offline: "Démo hors ligne (aucun flux configuré)",
};

export function PlayerProvider({
  streamUrl,
  metadataUrl,
  children,
}: {
  streamUrl: string;
  metadataUrl: string;
  children: React.ReactNode;
}) {
  const hasStream = Boolean(streamUrl);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const [state, setState] = useState<PlayerState>(hasStream ? "idle" : "offline");
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);

  // Restore remembered volume (per-visitor convenience only).
  useEffect(() => {
    try {
      const v = localStorage.getItem("jr:volume");
      if (v !== null) {
        const n = Math.min(1, Math.max(0, parseFloat(v)));
        if (!Number.isNaN(n)) setVolumeState(n);
      }
    } catch {
      /* storage may be unavailable; ignore */
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const stopMetadata = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setNowPlaying(null);
  }, []);

  const startMetadata = useCallback(() => {
    if (!metadataUrl || esRef.current || typeof EventSource === "undefined") return;
    try {
      const es = new EventSource(metadataUrl);
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          const title = data?.streamTitle || data?.title || null;
          if (typeof title === "string" && title.trim()) setNowPlaying(title.trim());
        } catch {
          /* non-JSON keep-alive frames are ignored */
        }
      };
      es.onerror = () => {
        es.close();
        esRef.current = null;
      };
      esRef.current = es;
    } catch {
      /* metadata is best-effort; never block playback */
    }
  }, [metadataUrl]);

  const play = useCallback(() => {
    if (!hasStream) {
      setState("offline");
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    setState("loading");
    // Cache-bust so the player always attaches to the live edge.
    audio.src = `${streamUrl}${streamUrl.includes("?") ? "&" : "?"}_=${Date.now()}`;
    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => setState("paused"));
    }
  }, [hasStream, streamUrl]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    stopMetadata();
    setState(hasStream ? "paused" : "offline");
  }, [hasStream, stopMetadata]);

  const toggle = useCallback(() => {
    if (state === "playing" || state === "loading") stop();
    else play();
  }, [state, play, stop]);

  const setVolume = useCallback((v: number) => {
    const n = Math.min(1, Math.max(0, v));
    setVolumeState(n);
    setMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = n;
      audioRef.current.muted = false;
    }
    try {
      localStorage.setItem("jr:volume", String(n));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  // Wire up <audio> lifecycle → state. The player ONLY reports "playing"/"live"
  // when the browser actually emits `playing` — never a fabricated claim.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlaying = () => {
      setState("playing");
      startMetadata();
    };
    const onWaiting = () => setState((s) => (s === "playing" ? "loading" : s));
    const onPause = () => setState((s) => (s === "playing" || s === "loading" ? "paused" : s));
    const onError = () => {
      if (audio.getAttribute("src")) setState("error");
    };
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [startMetadata]);

  useEffect(() => () => stopMetadata(), [stopMetadata]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      state,
      statusLabel: STATUS[state],
      isLive: state === "playing",
      nowPlaying,
      volume,
      muted,
      hasStream,
      play,
      stop,
      toggle,
      setVolume,
      toggleMute,
    }),
    [state, nowPlaying, volume, muted, hasStream, play, stop, toggle, setVolume, toggleMute],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {/* Single persistent audio element (survives route changes). */}
      <audio ref={audioRef} preload="none" aria-hidden="true" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within <PlayerProvider>");
  return ctx;
}
