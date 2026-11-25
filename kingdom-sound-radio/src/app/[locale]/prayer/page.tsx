import type { Metadata } from "next";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { PageHeader } from "@/components/ui/blocks";
import { PrayerForm } from "@/components/forms/public-forms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/prayer", t.forms.prayerTitle);
}

export default async function PrayerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  return (
    <>
      <PageHeader eyebrow={t.nav.community} title={t.forms.prayerTitle} intro={t.forms.prayerPrivacy} />
      <div className="container max-w-2xl py-10">
        <div className="card p-6 md:p-8">
          <PrayerForm locale={locale} t={t} />
        </div>
      </div>
    </>
  );
}
