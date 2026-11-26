import type { Metadata } from "next";
import { visibleServices } from "@/content/services";
import { CTA } from "@/components/CTA";
import { PageHeader } from "@/components/PageHeader";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceCard } from "@/components/ServiceCard";

export const metadata: Metadata = {
  title: "Auto Repair Services",
  description: "Diagnostics, general repairs and preventive maintenance — see what each service covers and request service.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  const services = visibleServices();
  return (
    <>
      <PageHeader eyebrow="Services" title="Auto repair services" intro="Choose the service closest to what you need. Not sure? Send a request and describe what is happening." />
      <section className="section">
        <div className="container-page">
          <h2 className="sr-only">All services</h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug}>
                <ServiceCard service={s} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section bg-navy-50">
        <div className="container-page">
          <h2 className="text-3xl font-extrabold tracking-tight">How a request works</h2>
          <div className="mt-8">
            <ProcessSteps />
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
