import type { Metadata } from "next";
import { business } from "@/config/business";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const NAV = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects", requiresProjects: true },
  { href: "/contact", label: "Contact" },
] as const;

export const navItems = () => NAV.filter((n) => !("requiresProjects" in n) || business.projects.length > 0);

/** Per-page metadata with canonical URL. Indexing is controlled centrally (proxy + robots). */
export function pageMeta(opts: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  const indexable = process.env.ALLOW_INDEXING === "true" && !opts.noindex;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: opts.title, description: opts.description, url: opts.path, siteName: business.name, type: "website", locale: "en_US" },
  };
}
