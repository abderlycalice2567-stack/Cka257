import type { Metadata } from "next";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { featuredTestimonies } from "@/modules/content";
import { PageHeader } from "@/components/ui/blocks";
import { TestimonyForm } from "@/components/forms/public-forms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/testimonies", t.nav.testimonies);
}

export default async function TestimoniesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const items = await featuredTestimonies(12);
  return (
    <>
      <PageHeader eyebrow={t.nav.community} title={t.nav.testimonies} />
      <div className="container grid gap-10 py-10 lg:grid-cols-[1fr_1fr]">
        <section>
          {items.length ? (
            <ul className="space-y-4">
              {items.map((x) => (
                <li key={x.id} className="card p-5">
                  <p className="leading-7">“{x.body}”</p>
                  <p className="mt-3 text-sm text-muted">— {x.name}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">{t.common.none}</p>
          )}
        </section>
        <section className="card h-fit p-6 md:p-8">
          <h2 className="mb-4 text-xl font-semibold">{t.forms.testimonyTitle}</h2>
          <TestimonyForm locale={locale} t={t} />
        </section>
      </div>
    </>
  );
}
