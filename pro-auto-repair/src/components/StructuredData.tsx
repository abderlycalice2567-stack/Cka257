import { business } from "@/config/business";
import { isProductionSite, siteUrl } from "@/config/site";

/** AutoRepair JSON-LD — emitted only in production and only from confirmed facts. */
export function StructuredData() {
  if (!isProductionSite || !business.identityVerified || !business.address || !business.phone) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: business.name,
    url: siteUrl,
    telephone: business.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.region,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    },
    ...(business.hours && {
      openingHoursSpecification: business.hours
        .filter((h): h is { day: string; open: string; close: string } => !("closed" in h))
        .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.day, opens: h.open, closes: h.close })),
    }),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
