import { isPreview } from "@/config/business";
import { services } from "@/content/services";
import { CTA } from "@/components/CTA";
import { PageHeader } from "@/components/PageHeader";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceCard } from "@/components/ServiceCard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Services",
  description: "General repair, diagnostics and maintenance. See what each service covers and start with a simple request.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHeader eyebrow="Services" title="Auto repair services" intro="Choose the service that's closest to what you need. Not sure? Send a request anyway and describe what's going on." />
      <section className="section">
        <div className="container">
          {isPreview ? <p className="draft-note mb-8">Proposed service list — each service is shown publicly only after the owner approves it.</p> : null}
          <ul className="grid gap-6 md:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug}>
                <ServiceCard service={s} headingLevel="h2" />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section bg-navy-50" aria-labelledby="services-process">
        <div className="container">
          <h2 id="services-process" className="text-3xl font-extrabold md:text-4xl">
            What happens after you send a request
          </h2>
          <div className="mt-10">
            <ProcessSteps />
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
