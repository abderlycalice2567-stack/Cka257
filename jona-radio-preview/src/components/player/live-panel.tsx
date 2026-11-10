"use client";

import { usePlayer } from "./player-context";
import { Equalizer } from "./equalizer";
import { PlayIcon, PauseIcon, VolumeIcon, MuteIcon } from "@/components/icons";

/** Rich "now playing" panel used on the hero and the dedicated listen page. */
export function LivePanel({ compact = false }: { compact?: boolean }) {
  const p = usePlayer();
  const live = p.state === "playing";
  const busy = p.state === "loading";
  const error = p.state === "error";

  return (
    <div
      className="relative mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8"
      role="group"
      aria-label="Lecteur en direct"
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            live ? "bg-red-500/20 text-red-200" : "bg-white/10 text-ivory/70"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-red-400" : "bg-ivory/40"}`} />
          {live ? "En direct" : p.hasStream ? "Direct" : "Démo hors ligne"}
        </span>
        <span className="text-gold-400">
          <Equalizer active={live} />
        </span>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <button
          type="button"
          onClick={p.toggle}
          disabled={!p.hasStream}
          aria-label={live || busy ? "Mettre en pause" : "Écouter en direct"}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold-500 text-navy-900 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {live && <span className="pointer-events-none absolute inset-0 rounded-full bg-gold-500 animate-pulse-ring" />}
          {busy ? (
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-navy-900/40 border-t-navy-900" aria-hidden="true" />
          ) : live ? (
            <PauseIcon width={30} height={30} />
          ) : (
            <PlayIcon width={30} height={30} />
          )}
        </button>
        <div className="min-w-0">
          <p className="font-display text-xl font-bold text-ivory">Jona Radio</p>
          <p className="mt-1 text-sm text-ivory/70" aria-live="polite">
            {p.nowPlaying ? `♪ ${p.nowPlaying}` : p.statusLabel}
          </p>
          {error && (
            <button onClick={p.play} className="mt-2 text-xs font-semibold text-gold-400 underline">
              Réessayer
            </button>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={p.toggleMute}
            aria-label={p.muted ? "Réactiver le son" : "Couper le son"}
            className="rounded-full p-2 text-ivory/80 hover:bg-white/10 hover:text-ivory"
          >
            {p.muted ? <MuteIcon /> : <VolumeIcon />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p.muted ? 0 : p.volume}
            onChange={(e) => p.setVolume(parseFloat(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer accent-gold-500"
            aria-label="Volume"
          />
        </div>
      )}

      {!p.hasStream && (
        <p className="mt-5 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-ivory/60">
          Aucun flux n’est configuré pour cette démo. Renseignez <code className="text-gold-400">NEXT_PUBLIC_STREAM_URL</code>{" "}
          (flux HTTPS Zeno.fm de la station, si autorisé, ou une source de démonstration sous licence) pour activer l’écoute.
        </p>
      )}
    </div>
  );
}
