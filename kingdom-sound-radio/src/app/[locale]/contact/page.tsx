import type { Metadata } from "next";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { getStation } from "@/modules/content";
import { PageHeader } from "@/components/ui/blocks";
import { ContactForm } from "@/components/forms/public-forms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/contact", t.pages.contactTitle);
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const station = await getStation();
  return (
    <>
      <PageHeader eyebrow={t.nav.contact} title={t.pages.contactTitle} />
      <div className="container grid gap-8 py-10 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-6 md:p-8">
          <ContactForm locale={locale} t={t} />
        </section>
        <aside className="card h-fit space-y-3 p-6 text-sm">
          <p className="font-semibold">{station.name}</p>
          {station.contact_email ? (
            <p><a className="link" href={`mailto:${station.contact_email}`}>{station.contact_email}</a></p>
          ) : (
            <p className="text-muted">Contact details will be published once confirmed by the station.</p>
          )}
          <p className="text-muted">{t.forms.prayerPrivacy}</p>
        </aside>
      </div>
    </>
  );
}
