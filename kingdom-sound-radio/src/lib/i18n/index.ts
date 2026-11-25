import en, { type Dictionary } from "./dictionaries/en";
import fr from "./dictionaries/fr";
import ht from "./dictionaries/ht";
import { type Locale, intlTags } from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, fr, ht };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export type { Dictionary };

export function formatDate(d: Date | string, locale: Locale, opts: Intl.DateTimeFormatOptions = { dateStyle: "long" }) {
  return new Intl.DateTimeFormat(intlTags[locale], opts).format(new Date(d));
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds < 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
