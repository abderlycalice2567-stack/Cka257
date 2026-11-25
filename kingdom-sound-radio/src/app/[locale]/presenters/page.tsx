import type { Metadata } from "next";
import Link from "next/link";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { pick } from "@/lib/i18n/config";
import { listPresenters, mediaUrl } from "@/modules/catalog";
import { Avatar } from "@/components/ui/art";
import { EmptyState, PageHeader, SampleBadge } from "@/components/ui/blocks";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/presenters", t.pages.presentersTitle);
}

export default async function PresentersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const presenters = await listPresenters();
  return (
    <>
      <PageHeader eyebrow={t.nav.presenters} title={t.pages.presentersTitle} />
      <div className="container py-10">
        {presenters.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {presenters.map((p) => (
              <Link key={p.id} href={`/${locale}/presenters/${p.slug}`} className="card flex items-center gap-4 p-5 hover:shadow-lift">
                <Avatar name={p.display_name} src={mediaUrl(p.photo_key)} size={72} />
                <div className="min-w-0">
                  <p className="text-lg font-semibold">{p.display_name}</p>
                  <p className="text-sm text-muted">{pick(p.title, locale)}</p>
                  {p.is_sample && <div className="mt-2"><SampleBadge label={t.common.sample} /></div>}
                </div>
              </Link>
            ))}
          </div>
        ) : <EmptyState>{t.common.none}</EmptyState>}
      </div>
    </>
  );
}
