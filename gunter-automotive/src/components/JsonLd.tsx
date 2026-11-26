import { business } from "@/config/business";
import { isLive, siteUrl } from "@/lib/site";

/**
 * AutoRepair structured data, emitted ONLY when the business identity is
 * verified (schemaVerified) and the site is live. Only confirmed fields are
 * included. No ratings, no invented service areas.
 */
export function JsonLd() {
  if (!isLive() || !business.schemaVerified) return null;
  const { street, city, region, postalCode } = business.address;
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: business.legalName ?? business.name,
    url: siteUrl(),
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(street && city ? { address: { "@type": "PostalAddress", streetAddress: street, addressLocality: city, addressRegion: region, postalCode: postalCode ?? undefined, addressCountry: "US" } } : {}),
    ...(business.hours
      ? {
          openingHoursSpecification: business.hours
            .filter((h) => h.open && h.close)
            .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.day, opens: h.open, closes: h.close })),
        }
      : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
