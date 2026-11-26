import Link from "next/link";
import { notFound } from "next/navigation";
import { isPreview } from "@/config/business";
import { getService, services } from "@/content/services";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { Illustration } from "@/components/Illustration";
import { ProcessSteps } from "@/components/ProcessSteps";
import { pageMetadata } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params) {
  const service = getService((await params).slug);
  if (!service) return {};
  return pageMetadata({ title: service.name, description: service.metaDescription, path: `/services/${service.slug}` });
}

function List({ items, tone }: { items: string[]; tone: "yes" | "no" }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-relaxed">
          <svg aria-hidden="true" className="mt-1 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tone === "yes" ? "#B83A32" : "#4A6078"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            {tone === "yes" ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M6 12h12" />}
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ServicePage({ params }: Params) {
  const service = getService((await params).slug);
  if (!service) notFound();
  return (
    <>
      <section className="border-b border-navy-100 bg-navy-50">
        <div className="container grid items-center gap-10 py-12 md:grid-cols-12 md:py-16">
          <div className="md:col-span-7">
            <nav aria-label="Breadcrumb" className="text-sm text-navy-600">
              <Link href="/services" className="inline-flex min-h-[44px] items-center underline underline-offset-4 hover:text-brand">
                Services
              </Link>
              <span aria-hidden="true" className="mx-2">
                /
              </span>
              <span aria-current="page">{service.name}</span>
            </nav>
            <h1 className="mt-1 text-4xl font-extrabold leading-tight md:text-5xl">{service.name}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-navy-600">{service.summary}</p>
            <Link href={`/request?service=${service.slug}`} className="btn-primary mt-7">
              Request service
            </Link>
          </div>
          <div className="md:col-span-5">
            <Illustration art={service.art} alt={`Illustration for ${service.name.toLowerCase()}`} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            {isPreview ? <p className="draft-note mb-8">Proposed draft copy — the scope of this service must be confirmed by the owner before publication.</p> : null}
            <h2 className="text-3xl font-extrabold">{service.problem.heading}</h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-600">{service.problem.body}</p>
          </div>
          <div className="grid gap-6 md:col-span-12 md:grid-cols-2">
            <div className="card p-6">
              <h2 className="text-xl font-bold">What this covers</h2>
              <List items={service.scope} tone="yes" />
            </div>
            <div className="card p-6">
              <h2 className="text-xl font-bold">What to keep in mind</h2>
              <List items={service.exclusions} tone="no" />
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-navy-50" aria-labelledby="service-process">
        <div className="container">
          <h2 id="service-process" className="text-3xl font-extrabold">
            How it works
          </h2>
          <div className="mt-10">
            <ProcessSteps />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="service-faq">
        <div className="container grid gap-8 md:grid-cols-12">
          <h2 id="service-faq" className="text-3xl font-extrabold md:col-span-4">
            Questions about {service.name.toLowerCase()}
          </h2>
          <div className="md:col-span-8">
            <FAQ items={service.faq} />
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
