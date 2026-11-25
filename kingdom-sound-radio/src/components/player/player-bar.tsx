"use client";

import Link from "next/link";
import { useState } from "react";
import { usePlayer, type LiveStatus } from "./player-provider";
import { ProgramArt } from "@/components/ui/art";
import * as I from "@/components/icons";
import type { Dictionary } from "@/lib/i18n";

export type PlayerStrings = Dictionary["live"] & { listenLive: string; share: string; copied: string; chapters: string };

function fmt(t: number) {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function StatusPill({ status, t }: { status: LiveStatus; t: PlayerStrings }) {
  const live = status === "live";
  const tone = live
    ? "bg-live text-white"
    : status === "error" || status === "unconfigured"
      ? "bg-surface-2 text-muted"
      : "bg-gold/20 text-fg";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tone}`} role="status" aria-live="polite">
      {live && <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-white" />}
      {t.status[status]}
    </span>
  );
}

export function PlayerBar({ t, locale }: { t: PlayerStrings; locale: string }) {
  const p = usePlayer();
  const [shared, setShared] = useState(false);
  if (p.mode === "idle") return null;

  const isLive = p.mode === "live";
  const title = isLive ? p.nowPlaying?.program?.title || t.autodj : (p.episode?.title ?? "");
  const subtitle = isLive
    ? p.nowPlaying?.track
      ? `${p.nowPlaying.track.title}${p.nowPlaying.track.artist ? " — " + p.nowPlaying.track.artist : ""}`
      : p.nowPlaying?.program?.presenters.join(", ") || "The Kingdom Sound Radio"
    : (p.episode?.subtitle ?? "");
  const busy = isLive && (p.liveStatus === "connecting" || p.liveStatus === "reconnecting" || p.liveStatus === "buffering");
  const active = isLive ? p.playing || busy : p.playing;
  const progress = p.duration ? (p.position / p.duration) * 100 : 0;

  const share = async () => {
    const url = isLive
      ? `${location.origin}/${locale}/live`
      : `${location.origin}${p.episode?.href}${p.position > 1 ? `?t=${Math.floor(p.position)}` : ""}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-40 border-t border-line bg-surface/95 backdrop-blur md:bottom-0"
      role="region"
      aria-label={t.nowPlaying}
    >
      {!isLive && (
        <div className="h-1 w-full bg-surface-2" aria-hidden="true">
          <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="container flex items-center gap-3 py-2.5">
        <ProgramArt seed={isLive ? "live-kingdom-sound" : (p.episode?.seed ?? "ep")} label={isLive ? "KS" : title} className="h-12 w-12 shrink-0" rounded="rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isLive && <StatusPill status={p.liveStatus} t={t} />}
            <p className="truncate text-sm font-semibold">{title}</p>
          </div>
          <p className="truncate text-xs text-muted">
            {isLive && p.liveStatus === "unconfigured" ? t.unconfiguredHelp : subtitle}
          </p>
        </div>

        {!isLive && (
          <button type="button" onClick={() => p.skip(-15)} className="btn-ghost hidden h-10 w-10 !p-0 sm:inline-flex" aria-label={t.back15}>
            <I.Back15 size={22} />
          </button>
        )}
        <button
          type="button"
          onClick={p.togglePlay}
          disabled={isLive && p.liveStatus === "unconfigured"}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isLive ? "bg-live text-white" : "bg-gold text-navy"} disabled:opacity-40`}
          aria-label={active ? (isLive ? t.stop : "Pause") : isLive ? t.listenLive : "Play"}
        >
          {active ? isLive ? <I.Stop /> : <I.Pause /> : <I.Play />}
        </button>
        {!isLive && (
          <button type="button" onClick={() => p.skip(30)} className="btn-ghost hidden h-10 w-10 !p-0 sm:inline-flex" aria-label={t.fwd30}>
            <I.Fwd30 size={22} />
          </button>
        )}
        <button type="button" onClick={() => p.setExpanded(!p.expanded)} className="btn-ghost h-10 w-10 !p-0" aria-expanded={p.expanded} aria-label={p.expanded ? t.collapse : t.expand}>
          {p.expanded ? <I.ChevronDown /> : <I.ChevronUp />}
        </button>
      </div>

      {p.expanded && (
        <div className="container grid gap-5 border-t border-line pb-5 pt-4 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            {!isLive && (
              <div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, Math.floor(p.duration))}
                  value={Math.floor(p.position)}
                  onChange={(e) => p.seek(Number(e.target.value))}
                  className="w-full accent-[#D4AF37]"
                  aria-label="Seek"
                  aria-valuetext={`${fmt(p.position)} / ${fmt(p.duration)}`}
                />
                <div className="mt-1 flex justify-between text-xs tabular-nums text-muted">
                  <span>{fmt(p.position)}</span>
                  <span>{fmt(p.duration)}</span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button type="button" className="btn-ghost h-10 w-10 !p-0" onClick={p.prev} aria-label="Restart"><I.SkipPrev /></button>
                  <button type="button" className="btn-ghost h-10 w-10 !p-0" onClick={() => p.skip(-15)} aria-label={t.back15}><I.Back15 size={24} /></button>
                  <button type="button" className="btn-ghost h-10 w-10 !p-0" onClick={() => p.skip(30)} aria-label={t.fwd30}><I.Fwd30 size={24} /></button>
                  <button type="button" className="btn-ghost h-10 w-10 !p-0" onClick={p.next} disabled={!p.queue.length} aria-label={t.queue}><I.SkipNext /></button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={p.toggleMute} className="btn-ghost h-9 w-9 !p-0" aria-label={p.muted ? t.unmute : t.mute}>
                {p.muted || p.volume === 0 ? <I.Mute /> : <I.Volume />}
              </button>
              <input type="range" min={0} max={100} value={Math.round((p.muted ? 0 : p.volume) * 100)} onChange={(e) => p.setVolume(Number(e.target.value) / 100)} className="w-full accent-[#D4AF37]" aria-label={t.volume} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {isLive ? (
                p.streams.length > 1 && (
                  <label className="flex items-center gap-2">
                    <span className="text-muted">{t.quality}</span>
                    <select className="input !w-auto !py-1.5" value={p.streamId ?? ""} onChange={(e) => p.setStream(e.target.value)}>
                      {p.streams.map((s) => (
                        <option key={s.id} value={s.id}>{s.label} · {s.bitrate_kbps} kbps</option>
                      ))}
                    </select>
                  </label>
                )
              ) : (
                <label className="flex items-center gap-2">
                  <span className="text-muted">{t.speed}</span>
                  <select className="input !w-auto !py-1.5" value={p.rate} onChange={(e) => p.setRate(Number(e.target.value))}>
                    {[0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                      <option key={r} value={r}>{r}×</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2">
                <span className="text-muted">{t.sleepTimer}</span>
                <select className="input !w-auto !py-1.5" value={p.sleepMinutes ?? ""} onChange={(e) => p.setSleep(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">{t.sleepOff}</option>
                  {[15, 30, 45, 60, 90].map((m) => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={share} className="btn-outline btn-sm">
                <I.Share size={16} /> {shared ? t.copied : isLive ? t.share : t.shareTimestamp}
              </button>
              {isLive && p.nowPlaying?.listeners != null && (
                <span className="chip">{p.nowPlaying.listeners} {t.listeners}</span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {!isLive && p.episode?.chapters?.length ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold">{t.chapters}</h3>
                <ol className="space-y-1">
                  {p.episode.chapters.map((c) => (
                    <li key={c.start_seconds}>
                      <button type="button" className="flex w-full justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2" onClick={() => p.seek(c.start_seconds)}>
                        <span>{c.title}</span>
                        <span className="tabular-nums text-muted">{fmt(c.start_seconds)}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {isLive && p.nowPlaying?.next && (
              <p className="text-sm text-muted">
                <span className="font-semibold text-fg">{t.upNext}:</span> {p.nowPlaying.next.title}
              </p>
            )}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t.queue} ({p.queue.length})</h3>
                {p.queue.length > 0 && (
                  <button type="button" className="text-xs text-muted hover:text-fg" onClick={p.clearQueue}>{t.clearQueue}</button>
                )}
              </div>
              <ul className="space-y-1">
                {p.queue.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                    <Link href={q.href} className="truncate">{q.title}</Link>
                    <button type="button" className="btn-ghost h-8 w-8 !p-0" onClick={() => p.playEpisode(q)} aria-label={`Play ${q.title}`}><I.Play size={16} /></button>
                  </li>
                ))}
              </ul>
              {isLive && (
                <p className="mt-2 text-xs text-muted">{t.autodjNote}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
