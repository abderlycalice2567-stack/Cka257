import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/business";
import { gallery, services } from "@/content/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/services", ...services.map((s) => `/services/${s.slug}`), "/about", ...(gallery.length ? ["/workshop"] : []), "/request", "/contact", "/privacy"];
  return paths.map((p) => ({ url: `${siteUrl}${p === "/" ? "" : p}`, changeFrequency: "monthly", priority: p === "/" ? 1 : p === "/request" ? 0.9 : 0.7 }));
}
