import type { MetadataRoute } from "next";
import { isLive, showWorkshop, siteUrl, visibleServices } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isLive()) return [];
  const base = siteUrl();
  const paths = ["/", "/services", ...visibleServices().map((s) => `/services/${s.slug}`), "/about", ...(showWorkshop() ? ["/workshop"] : []), "/request", "/contact", "/privacy"];
  return paths.map((p) => ({ url: `${base}${p === "/" ? "" : p}` }));
}
