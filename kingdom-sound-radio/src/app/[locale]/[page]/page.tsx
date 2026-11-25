import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { isLocale } from "@/lib/i18n/config";
import { getPage } from "@/modules/content";
import { Markdown } from "@/lib/markdown";
import { PageHeader, SampleBadge } from "@/components/ui/blocks";

/** Editable pages managed in Admin → Content → Pages. */
const CMS_PAGES = ["about", "mission", "leadership", "faq", "privacy", "terms", "accessibility"] as const;

type Params = Promise<{ locale: string; page: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, page } = await params;
  if (!isLocale(locale) || !(CMS_PAGES as readonly string[]).includes(page)) return {};
  const p = await getPage(page, locale);
  return p ? localizedMeta(locale, `/${page}`, p.title) : {};
}

export default async function CmsPage({ params }: { params: Params }) {
  const { locale, t } = await resolveLocale(params);
  const { page } = await params;
  if (!(CMS_PAGES as readonly string[]).includes(page)) notFound();
  const p = await getPage(page, locale);
  if (!p) notFound();
  return (
    <>
      <PageHeader eyebrow={t.nav.about} title={p.title} />
      <div className="container max-w-3xl py-10">
        {p.is_sample && <div className="mb-6"><SampleBadge label={t.common.sample} /></div>}
        <Markdown source={p.body} />
      </div>
    </>
  );
}
