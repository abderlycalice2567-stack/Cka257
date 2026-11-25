import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { locales } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const STATIC = ["", "/live", "/programs", "/schedule", "/podcasts", "/presenters", "/news", "/devotionals", "/events", "/community", "/prayer", "/testimonies", "/about", "/mission", "/leadership", "/support", "/contact", "/faq", "/privacy", "/terms", "/accessibility"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const alt = (path: string) => ({ languages: Object.fromEntries(locales.map((l) => [l, `${env.appUrl}/${l}${path}`])) });
  const out: MetadataRoute.Sitemap = [];
  for (const p of STATIC) out.push({ url: `${env.appUrl}/en${p}`, alternates: alt(p) });
  const [programs, episodes, presenters, articles] = await Promise.all([
    sql<{ slug: string; updated_at: Date }[]>`SELECT slug, updated_at FROM programs WHERE status = 'published'`,
    sql<{ program: string; slug: string; updated_at: Date }[]>`SELECT p.slug AS program, e.slug, e.updated_at FROM episodes e JOIN programs p ON p.id = e.program_id AND p.status = 'published' WHERE e.status = 'published' AND e.published_at <= now()`,
    sql<{ slug: string }[]>`SELECT slug FROM presenters WHERE published`,
    sql<{ slug: string; locale: string; updated_at: Date }[]>`SELECT slug, locale, updated_at FROM articles WHERE status = 'published' AND published_at <= now()`,
  ]);
  for (const p of programs) out.push({ url: `${env.appUrl}/en/programs/${p.slug}`, lastModified: p.updated_at, alternates: alt(`/programs/${p.slug}`) });
  for (const e of episodes) out.push({ url: `${env.appUrl}/en/programs/${e.program}/${e.slug}`, lastModified: e.updated_at, alternates: alt(`/programs/${e.program}/${e.slug}`) });
  for (const p of presenters) out.push({ url: `${env.appUrl}/en/presenters/${p.slug}`, alternates: alt(`/presenters/${p.slug}`) });
  for (const a of articles) out.push({ url: `${env.appUrl}/${a.locale}/news/${a.slug}`, lastModified: a.updated_at });
  return out;
}
