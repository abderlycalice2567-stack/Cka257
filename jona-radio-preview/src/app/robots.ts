import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Keep the speculative preview out of search engines by default (section 11).
 * Only emits an allow-list if NEXT_PUBLIC_ALLOW_INDEXING === "true".
 */
export default function robots(): MetadataRoute.Robots {
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
  if (!allow) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
