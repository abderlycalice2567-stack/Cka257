import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { visibleServices } from "@/content/services";
import { showWorkshop } from "@/components/nav";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/services",
    ...visibleServices().map((s) => `/services/${s.slug}`),
    "/about",
    ...(showWorkshop ? ["/workshop"] : []),
    "/request",
    "/contact",
    "/privacy",
  ];
  return paths.map((p) => ({ url: `${siteUrl}${p}` }));
}
