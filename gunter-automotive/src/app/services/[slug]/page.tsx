import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { IconCheck } from "@/components/Icons";
import { PageHeader } from "@/components/PageHeader";
import { getService, services } from "@/content/services";
import { isLive, visibleServices } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => services.map((s) => ({ slug: s.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getService((await params).slug);
  if (!s) return {};
  return { title: `${s.name} Services`, description: s.summary, alternates: { canonical: `/services/${s.slug}` } };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const s = getService(slug);
  if (!s || !visibleServices().includes(s)) notFound();

  return (
    <>
      <PageHeader eyebrow="Services" title={s.name} intro={s.summary} />
      {!s.approved && !isLive() && (
        <div className="container pt-6">
          <p className="draft-note">Draft scope for the sales prototype. To be confirmed or corrected by the owner before publication.</p>
        </div>
      )}
      <div className="container grid gap-12 py-12 md:grid-cols-12 md:py-16">
        <div className="space-y-12 md:col-span-8">
          <section aria-labelledby="problem">
            <h2 id="problem" className="text-2xl font-bold">
              Sound familiar?
            </h2>
            <p className="mt-3 text-lg text-ink-muted">{s.problem}</p>
          </section>
          <section aria-labelledby="scope">
            <h2 id="scope" className="text-2xl font-bold">
              What this can include
            </h2>
            <ul className="mt-4 space-y-3">
              {s.scope.map((item) => (
                <li key={item} className="flex gap-3">
                  <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="exclusions">
            <h2 id="exclusions" className="text-2xl font-bold">
              Good to know
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-muted">
              {s.exclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="process">
            <h2 id="process" className="text-2xl font-bold">
              How it works
            </h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3">
              {s.process.map((step, i) => (
                <li key={step} className="card p-5">
                  <span className="font-display text-sm font-bold text-amber-800">Step {i + 1}</span>
                  <p className="mt-1 font-semibold text-brand">{step}</p>
                </li>
              ))}
            </ol>
          </section>
          <FAQ items={s.faq} title={`${s.name} FAQ`} />
        </div>
        <aside className="md:col-span-4">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold">Need {s.name.toLowerCase()}?</h2>
            <p className="mt-2 text-sm text-ink-muted">Tell us about your vehicle and what you need. The shop will follow up to discuss it.</p>
            <Link href={`/request?service=${s.slug}`} className="btn-primary mt-4 w-full">
              Schedule a service request
            </Link>
            <nav aria-label="Other services" className="mt-6 border-t border-brand-100 pt-4">
              <p className="text-sm font-semibold text-ink">Other services</p>
              <ul className="mt-2 space-y-1">
                {visibleServices()
                  .filter((o) => o.slug !== s.slug)
                  .map((o) => (
                    <li key={o.slug}>
                      <Link href={`/services/${o.slug}`} className="inline-flex min-h-touch items-center font-semibold text-amber-800 hover:underline">
                        {o.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        </aside>
      </div>
      <CTA />
    </>
  );
}
