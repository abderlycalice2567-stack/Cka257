import type { Metadata } from "next";
import { business, locationLabel, siteUrl } from "@/config/business";

export function pageMetadata({ title, description, path, noindex = false }: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${business.name}`, description, url: `${siteUrl}${path}`, siteName: business.name, type: "website", locale: "en_US" },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * AutoRepair structured data. Emitted ONLY for an owner-approved build and
 * ONLY with confirmed facts — unverified fields are left out, never guessed.
 * No ratings, reviews or service areas are ever generated here.
 */
export function autoRepairJsonLd(): Record<string, unknown> | null {
  if (!business.ownerApproved) return null;
  const { address, phone, hours } = business;
  const days: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: business.name,
    url: siteUrl,
    ...(phone ? { telephone: phone } : {}),
    ...(address.confirmed && address.street
      ? { address: { "@type": "PostalAddress", streetAddress: address.street, addressLocality: address.city, addressRegion: address.region, ...(address.postalCode ? { postalCode: address.postalCode } : {}), addressCountry: "US" } }
      : {}),
    ...(hours
      ? {
          openingHoursSpecification: hours
            .filter((h): h is { day: string; open: string; close: string } => !("closed" in h))
            .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: days[h.day.slice(0, 3)] ?? h.day, opens: h.open, closes: h.close })),
        }
      : {}),
  };
}

export const defaultDescription = `${business.name} — auto repair in ${locationLabel()}. Explore services and start with a simple service request.`;
