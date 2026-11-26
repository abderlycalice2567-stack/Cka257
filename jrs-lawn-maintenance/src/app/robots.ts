import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (process.env.ALLOW_INDEXING !== "true") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/thank-you"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
