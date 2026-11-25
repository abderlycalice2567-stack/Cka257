import "server-only";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { env } from "@/lib/env";

export type LocaleParams = Promise<{ locale: string }>;

export async function resolveLocale(params: Promise<{ locale: string }>): Promise<{ locale: Locale; t: ReturnType<typeof getDictionary> }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, t: getDictionary(locale) };
}

/** Canonical + hreflang alternates for a locale-relative path ("" for home). */
export function localizedMeta(locale: Locale, path: string, title?: string, description?: string): Metadata {
  const languages = Object.fromEntries(locales.map((l) => [l, `${env.appUrl}/${l}${path}`]));
  return {
    title,
    description,
    alternates: { canonical: `${env.appUrl}/${locale}${path}`, languages: { ...languages, "x-default": `${env.appUrl}/en${path}` } },
    openGraph: {
      title,
      description,
      url: `${env.appUrl}/${locale}${path}`,
      siteName: "The Kingdom Sound Radio",
      locale,
      type: "website",
      images: [{ url: "/brand/og-image.jpg", width: 1200, height: 630, alt: "The Kingdom Sound Radio" }],
    },
  };
}

export function sp(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
