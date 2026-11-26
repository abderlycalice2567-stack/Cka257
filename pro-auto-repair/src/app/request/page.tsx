import type { Metadata } from "next";
import { business } from "@/config/business";
import { backendStatus } from "@/config/site";
import { visibleServices } from "@/content/services";
import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";

export const metadata: Metadata = {
  title: "Request Repair Service",
  description: "Tell us about your vehicle and what you need. A request is not a booking — the shop will follow up with you.",
  alternates: { canonical: "/request" },
};

export const dynamic = "force-dynamic";

export default function RequestPage({ searchParams }: { searchParams: { service?: string } }) {
  const services = visibleServices().map(({ slug, name }) => ({ slug, name }));
  const initial = services.find((s) => s.slug === searchParams.service)?.slug;
  return (
    <>
      <PageHeader eyebrow="Request service" title="Request repair service" intro="Share a few details and the shop will get in touch to discuss next steps." />
      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <RequestForm services={services} demo={backendStatus().demo} initialService={initial} />
          </div>
          <aside className="lg:col-span-5">
            <div className="card bg-navy-50">
              <h2 className="text-xl font-bold">What to expect</h2>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-muted">
                <li>Sending this form does not book an appointment or produce a quote.</li>
                <li>A preferred date is a request; availability is confirmed with you directly.</li>
                <li>No payment details are needed or collected here.</li>
                {business.responseExpectation && <li>{business.responseExpectation}</li>}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
