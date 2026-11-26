import type { Metadata } from "next";
import { CTA } from "@/components/CTA";
import { PageHeader } from "@/components/PageHeader";
import { ServiceCard } from "@/components/ServiceCard";
import { visibleServices } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description: "Maintenance, diagnostics and repair. Explore what Gunter Automotive can help with, then send a service request.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  const svc = visibleServices();
  return (
    <>
      <PageHeader eyebrow="Services" title="How we can help" intro="Choose a service to see what's involved, or start a request and describe what you need in your own words." />
      <section className="section">
        <div className="container">
          {svc.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {svc.map((s) => (
                <ServiceCard key={s.slug} service={s} />
              ))}
            </div>
          ) : (
            <p className="text-ink-muted">Service details are being finalised. Please send a request and the shop will follow up.</p>
          )}
          <p className="mt-10 max-w-2xl text-sm text-ink-muted">
            Not sure which service fits? Choose &ldquo;Not sure&rdquo; on the request form and describe what&apos;s happening.
          </p>
        </div>
      </section>
      <CTA />
    </>
  );
}
