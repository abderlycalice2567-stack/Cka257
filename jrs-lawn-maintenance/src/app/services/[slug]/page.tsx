import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPrototype } from "@/config/business";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { IllustrativeImage } from "@/components/IllustrativeImage";
import { Process } from "@/components/Process";
import { ButtonLink, Container, DraftNote, Section } from "@/components/ui";
import { getService, services } from "@/content/services";
import { pageMeta } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = getService((await params).slug);
  if (!s) return {};
  return pageMeta({ title: `${s.name} in Athens, GA`, description: s.metaDescription, path: `/services/${s.slug}` });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const service = getService((await params).slug);
  if (!service) notFound();
  const prototype = isPrototype();

  return (
    <>
      <section aria-labelledby="page-title" className="bg-tan-light">
        <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <nav aria-label="Breadcrumb" className="mb-4 text-sm">
              <ol className="flex flex-wrap gap-2 text-muted">
                <li>
                  <Link href="/services" className="underline underline-offset-2 hover:text-pine">
                    Services
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-pine-ink">
                  {service.name}
                </li>
              </ol>
            </nav>
            <h1 id="page-title" className="font-heading text-4xl font-extrabold text-pine-ink sm:text-5xl">
              {service.name}
            </h1>
            <p className="mt-4 text-lg text-muted">{service.summary}</p>
            <ButtonLink href={`/request?service=${service.slug}`} className="mt-8">
              Request {service.shortName.toLowerCase()}
            </ButtonLink>
          </div>
          <div className="lg:col-span-6">
            <IllustrativeImage src={service.image.src} alt={service.image.alt} width={600} height={400} priority />
          </div>
        </Container>
      </section>

      <Section labelledBy="problem-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="problem-title" className="font-heading text-3xl font-extrabold text-pine-ink">
              The problem
            </h2>
            <p className="mt-4 text-lg text-muted">{service.problem}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7">
            <div className="rounded-card border border-pine/15 bg-white p-6">
              <h2 className="font-heading text-xl font-bold text-pine-ink">What&apos;s typically included</h2>
              <ul className="mt-4 space-y-2">
                {service.scope.map((item) => (
                  <li key={item} className="flex gap-3 text-muted">
                    <span aria-hidden="true" className="font-bold text-pine">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-card border border-pine/15 bg-tan-light p-6">
              <h2 className="font-heading text-xl font-bold text-pine-ink">Not included</h2>
              <ul className="mt-4 space-y-2">
                {service.exclusions.map((item) => (
                  <li key={item} className="flex gap-3 text-muted">
                    <span aria-hidden="true" className="font-bold text-pine">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {prototype && <DraftNote>scope and exclusions are proposals. The owner confirms them before launch; no prices or guarantees are stated.</DraftNote>}
      </Section>

      <Section labelledBy="service-process" tone="cream">
        <Process steps={service.process} headingId="service-process" />
      </Section>

      <Section labelledBy="service-faq">
        <div className="max-w-3xl">
          <FAQ items={service.faq} headingId="service-faq" title={`${service.name} questions`} />
        </div>
      </Section>

      <CTA title={`Interested in ${service.shortName.toLowerCase()}?`} body="Tell us about your yard and the owner will follow up to discuss it." />
    </>
  );
}
