import type { MetadataRoute } from "next";
import { isPreview, siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  if (isPreview) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/thank-you"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
