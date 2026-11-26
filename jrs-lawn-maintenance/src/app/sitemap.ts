import type { MetadataRoute } from "next";
import { business } from "@/config/business";
import { visibleServices } from "@/content/services";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/services", ...visibleServices().map((s) => `/services/${s.slug}`), "/about", ...(business.projects.length ? ["/projects"] : []), "/request", "/contact", "/privacy"];
  return paths.map((p) => ({ url: `${SITE_URL}${p === "/" ? "" : p}` }));
}
