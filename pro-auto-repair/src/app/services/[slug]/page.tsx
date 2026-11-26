import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, visibleServices } from "@/content/services";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { PageHeader } from "@/components/PageHeader";
import { ProcessSteps } from "@/components/ProcessSteps";

type Props = { params: { slug: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  return visibleServices().map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const service = getService(params.slug);
  if (!service) return {};
  return { title: service.name, description: service.summary, alternates: { canonical: `/services/${service.slug}` } };
}

export default function ServicePage({ params }: Props) {
  const service = getService(params.slug);
  if (!service) notFound();
  return (
    <>
      <PageHeader eyebrow="Service" title={service.name} intro={service.summary} />
      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="text-2xl font-bold">The problem</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted">{service.problem}</p>

            <h2 className="mt-10 text-2xl font-bold">What this service covers</h2>
            <ul className="mt-4 space-y-3">
              {service.scope.map((item) => (
                <li key={item} className="flex gap-3">
                  <svg className="mt-1 shrink-0 text-teal" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-2xl font-bold">What is not included</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
              {service.exclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <aside className="lg:col-span-5">
            <div className="card bg-navy-50 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold">Request {service.name.toLowerCase()}</h2>
              <p className="mt-2 leading-relaxed text-muted">
                Tell us about your vehicle and what you need. Sending a request does not book an appointment.
              </p>
              <Link href={`/request?service=${service.slug}`} className="btn-primary mt-5 w-full">
                Request repair service
              </Link>
            </div>
          </aside>
        </div>
      </section>
      <section className="section bg-navy-50">
        <div className="container-page">
          <h2 className="text-3xl font-extrabold tracking-tight">What happens next</h2>
          <div className="mt-8">
            <ProcessSteps />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container-page max-w-3xl">
          <FAQ items={service.faqs} heading={`${service.name} questions`} />
        </div>
      </section>
      <CTA />
    </>
  );
}
