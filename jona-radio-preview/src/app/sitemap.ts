import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { programs, news } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const staticPaths = [
    "",
    "/ecouter-en-direct",
    "/nos-emissions",
    "/a-propos",
    "/actualites",
    "/contact",
    "/demandes-de-priere",
    "/soutenir",
    "/confidentialite",
    "/mentions-legales",
  ];
  const now = new Date();
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, lastModified: now })),
    ...programs.map((p) => ({ url: `${base}/nos-emissions/${p.slug}`, lastModified: now })),
    ...news.map((n) => ({ url: `${base}/actualites/${n.slug}`, lastModified: now })),
  ];
}
