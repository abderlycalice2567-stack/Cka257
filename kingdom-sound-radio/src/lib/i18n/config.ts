export const locales = ["en", "fr", "ht"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ht: "Kreyòl ayisyen",
};

/** BCP-47 tags used for <html lang>, hreflang and Intl formatting. */
export const localeTags: Record<Locale, string> = { en: "en", fr: "fr", ht: "ht" };
/** Intl does not ship Haitian Creole date data everywhere; French is the closest fallback. */
export const intlTags: Record<Locale, string> = { en: "en-US", fr: "fr-FR", ht: "fr-HT" };

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}

/** Picks a translated value from a {en, fr, ht} json column, falling back to English. */
export function pick(value: unknown, locale: Locale): string {
  if (!value || typeof value !== "object") return typeof value === "string" ? value : "";
  const v = value as Partial<Record<Locale, string>>;
  return v[locale] || v.en || v.fr || v.ht || "";
}

export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const prefs = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: (tag || "").toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of prefs) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
