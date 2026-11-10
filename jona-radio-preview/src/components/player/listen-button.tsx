"use client";

import { usePlayer } from "./player-context";
import { PlayIcon, PauseIcon } from "@/components/icons";

export function ListenButton({
  size = "md",
  className = "",
  label = "Écouter en direct",
}: {
  size?: "md" | "lg";
  className?: string;
  label?: string;
}) {
  const p = usePlayer();
  const live = p.state === "playing";
  const busy = p.state === "loading";
  const dims = size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm";
  return (
    <button type="button" onClick={p.toggle} className={`btn-gold ${dims} ${className}`} disabled={!p.hasStream}>
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/40 border-t-navy-900" aria-hidden="true" />
      ) : live ? (
        <PauseIcon width={18} height={18} />
      ) : (
        <PlayIcon width={18} height={18} />
      )}
      {busy ? "Connexion…" : live ? "En pause" : label}
    </button>
  );
}
