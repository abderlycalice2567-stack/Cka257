import type { MetadataRoute } from "next";
import { allowIndexing, siteUrl } from "@/config/business";

export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/thank-you"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
