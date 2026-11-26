import { business, isHoursVerified, isPhoneVerified } from "@/config/business";
import { SITE_URL } from "@/lib/site";

/**
 * LocalBusiness structured data, emitted only once the business identity is
 * verified and only with confirmed fields. No ratings or reviews are ever invented.
 */
export function LocalBusinessJsonLd() {
  if (!business.nameVerified) return null;
  const data: Record<string, unknown> = { "@context": "https://schema.org", "@type": "LocalBusiness", name: business.name, url: SITE_URL };
  if (isPhoneVerified()) data.telephone = business.phone.value.e164;
  if (business.location.verified) {
    data.address = {
      "@type": "PostalAddress",
      addressLocality: business.location.value.locality,
      addressRegion: business.location.value.region,
      addressCountry: business.location.value.country,
      ...(business.streetAddress.verified ? { streetAddress: business.streetAddress.value } : {}),
    };
  }
  if (isHoursVerified()) data.openingHours = business.hours.value.map((h) => `${h.days} ${h.open}-${h.close}`);
  if (business.serviceArea.verified) data.areaServed = business.serviceArea.value;
  // Non-executable data block; "<" is escaped so the content cannot close the tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
