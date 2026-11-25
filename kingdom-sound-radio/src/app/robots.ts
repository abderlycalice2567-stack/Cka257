import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (!env.allowIndexing) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/*/account", "/*/sign-in", "/*/sign-up"] }],
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
