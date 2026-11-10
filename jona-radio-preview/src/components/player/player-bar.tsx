"use client";

import { usePlayer } from "./player-context";
import { Equalizer } from "./equalizer";
import { PlayIcon, PauseIcon, VolumeIcon, MuteIcon } from "@/components/icons";

/** Persistent bottom player bar. Rendered once in the layout. */
export function PlayerBar() {
  const p = usePlayer();
  const busy = p.state === "loading";
  const live = p.state === "playing";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-900/95 text-ivory backdrop-blur supports-[backdrop-filter]:bg-navy-900/80"
      role="region"
      aria-label="Lecteur radio Jona Radio"
    >
      <div className="container-page flex items-center gap-3 py-2.5 sm:gap-4">
        <button
          type="button"
          onClick={p.toggle}
          disabled={!p.hasStream}
          aria-label={live || busy ? "Mettre en pause" : "Écouter en direct"}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500 text-navy-900 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {live && (
            <span className="pointer-events-none absolute inset-0 rounded-full bg-gold-500 animate-pulse-ring" />
          )}
          {busy ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/40 border-t-navy-900"
              aria-hidden="true"
            />
          ) : live ? (
            <PauseIcon width={18} height={18} />
          ) : (
            <PlayIcon width={18} height={18} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                live ? "bg-red-500/20 text-red-200" : "bg-white/10 text-ivory/70"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${live ? "bg-red-400" : "bg-ivory/40"}`}
              />
              {live ? "En direct" : "Direct"}
            </span>
            <span className="truncate text-sm font-semibold">Jona Radio</span>
            <span className="text-gold-400">
              <Equalizer active={live} />
            </span>
          </div>
          <p className="truncate text-xs text-ivory/70" aria-live="polite">
            {p.nowPlaying ? `♪ ${p.nowPlaying}` : p.statusLabel}
          </p>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={p.toggleMute}
            aria-label={p.muted ? "Réactiver le son" : "Couper le son"}
            className="rounded-full p-2 text-ivory/80 hover:bg-white/10 hover:text-ivory"
          >
            {p.muted ? <MuteIcon width={18} height={18} /> : <VolumeIcon width={18} height={18} />}
          </button>
          <label className="sr-only" htmlFor="jr-volume">
            Volume
          </label>
          <input
            id="jr-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p.muted ? 0 : p.volume}
            onChange={(e) => p.setVolume(parseFloat(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-gold-500"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
