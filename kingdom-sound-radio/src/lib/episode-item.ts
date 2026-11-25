import type { EpisodeItem } from "@/components/player/player-provider";
import type { EpisodeRow } from "@/modules/catalog";
import { mediaUrl } from "@/modules/catalog";
import { pick, type Locale } from "@/lib/i18n/config";

export function toEpisodeItem(e: EpisodeRow, locale: Locale, chapters?: { start_seconds: number; title: string }[]): EpisodeItem | null {
  const audio = mediaUrl(e.audio_key);
  if (!audio) return null;
  return {
    id: e.id,
    title: e.title,
    subtitle: pick(e.program_title, locale),
    href: `/${locale}/programs/${e.program_slug}/${e.slug}`,
    audioUrl: audio,
    duration: e.duration_seconds,
    seed: e.program_slug,
    chapters,
  };
}
