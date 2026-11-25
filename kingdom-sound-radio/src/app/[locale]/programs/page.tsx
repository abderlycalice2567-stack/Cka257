import type { Metadata } from "next";
import Link from "next/link";
import { localizedMeta, resolveLocale, sp } from "@/lib/page";
import { pick } from "@/lib/i18n/config";
import { listCategories, listPrograms } from "@/modules/catalog";
import { EmptyState, PageHeader, ProgramCard } from "@/components/ui/blocks";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/programs", t.pages.programsTitle, t.pages.programsIntro);
}

export default async function ProgramsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const q = await searchParams;
  const category = sp(q.category);
  const language = sp(q.language);
  const [programs, categories] = await Promise.all([
    listPrograms({ category: category || undefined, language: language || undefined }),
    listCategories(),
  ]);
  const used = new Set((await listPrograms()).map((p) => p.category_slug));
  const link = (c?: string) => {
    const u = new URLSearchParams();
    if (c) u.set("category", c);
    if (language) u.set("language", language);
    const s = u.toString();
    return `/${locale}/programs${s ? `?${s}` : ""}`;
  };
  return (
    <>
      <PageHeader eyebrow={t.nav.programs} title={t.pages.programsTitle} intro={t.pages.programsIntro} />
      <div className="container py-10">
        <nav className="mb-8 flex flex-wrap gap-2" aria-label={t.common.category}>
          <Link href={link()} className={!category ? "btn-gold btn-sm" : "btn-outline btn-sm"} aria-current={!category ? "page" : undefined}>{t.common.allCategories}</Link>
          {categories.filter((c) => used.has(c.slug)).map((c) => (
            <Link key={c.slug} href={link(c.slug)} className={category === c.slug ? "btn-gold btn-sm" : "btn-outline btn-sm"} aria-current={category === c.slug ? "page" : undefined}>
              {pick(c.name, locale)}
            </Link>
          ))}
        </nav>
        {programs.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => <ProgramCard key={p.id} p={p} locale={locale} t={t} />)}
          </div>
        ) : <EmptyState>{t.common.none}</EmptyState>}
      </div>
    </>
  );
}
