"use client";

import { usePlayer, type EpisodeItem } from "./player-provider";
import * as I from "@/components/icons";

/** "Listen live" button usable anywhere; reflects the real stream state. */
export function ListenLiveButton({ label, stopLabel, className = "btn-live" }: { label: string; stopLabel: string; className?: string }) {
  const p = usePlayer();
  const on = p.mode === "live" && (p.playing || p.liveStatus === "connecting" || p.liveStatus === "reconnecting" || p.liveStatus === "buffering");
  return (
    <button type="button" className={className} onClick={() => (on ? p.stop() : p.playLive())} aria-pressed={on}>
      {on ? <I.Stop size={16} /> : <I.Radio size={18} />}
      {on ? stopLabel : label}
    </button>
  );
}

/**
 * Header status: "Live" only while this browser is actually playing the
 * stream; "On air" only when the broadcasting engine reports the station
 * online. With no engine connected and nothing playing, it shows nothing.
 */
export function LiveIndicator({ liveLabel, onAirLabel }: { liveLabel: string; onAirLabel: string }) {
  const p = usePlayer();
  const live = p.mode === "live" && p.liveStatus === "live";
  const onAir = p.nowPlaying?.online === true;
  if (!live && !onAir) return null;
  return (
    <span className="hidden items-center gap-1.5 text-xs font-medium text-muted lg:inline-flex" aria-live="polite">
      <span className="h-2 w-2 animate-pulseDot rounded-full bg-live" />
      {live ? liveLabel : onAirLabel}
    </span>
  );
}

export function PlayEpisodeButton({
  episode,
  label,
  pauseLabel,
  queueLabel,
  className = "btn-gold",
  compact = false,
  startAt,
}: {
  episode: EpisodeItem;
  label: string;
  pauseLabel: string;
  queueLabel?: string;
  className?: string;
  compact?: boolean;
  startAt?: number;
}) {
  const p = usePlayer();
  const isCurrent = p.mode === "episode" && p.episode?.id === episode.id;
  const playing = isCurrent && p.playing;
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className={compact ? "inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold text-navy hover:bg-gold-300" : className}
        onClick={() => (isCurrent ? p.togglePlay() : p.playEpisode(episode, startAt))}
        aria-label={compact ? `${playing ? pauseLabel : label}: ${episode.title}` : undefined}
      >
        {playing ? <I.Pause size={compact ? 18 : 16} /> : <I.Play size={compact ? 18 : 16} />}
        {!compact && (playing ? pauseLabel : label)}
      </button>
      {queueLabel && !compact && (
        <button type="button" className="btn-outline btn-sm" onClick={() => p.enqueue(episode)}>
          <I.List size={16} /> {queueLabel}
        </button>
      )}
    </span>
  );
}
