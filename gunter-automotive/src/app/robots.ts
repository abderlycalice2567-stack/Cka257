import type { MetadataRoute } from "next";
import { isLive, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isLive()) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/thank-you"] }, sitemap: `${siteUrl()}/sitemap.xml` };
}
