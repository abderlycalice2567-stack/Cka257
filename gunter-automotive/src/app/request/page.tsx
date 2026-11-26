import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { business, hasPhone } from "@/config/business";

export const metadata: Metadata = {
  title: "Schedule a Service Request",
  description: "Tell Gunter Automotive about your vehicle and what you need. The shop will follow up to discuss the details.",
  alternates: { canonical: "/request" },
};

type Props = { searchParams: Promise<{ service?: string }> };

export default async function RequestPage({ searchParams }: Props) {
  const { service } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Request service" title="Schedule a service request" intro="Tell us what you need. It takes about two minutes." />
      <section className="section pt-10">
        <div className="container grid gap-12 md:grid-cols-12">
          <div className="card md:col-span-8 md:p-10">
            <RequestForm defaultService={service} />
          </div>
          <aside className="space-y-6 md:col-span-4">
            <div className="card">
              <h2 className="text-lg font-bold">What happens next</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
                <li>Your request goes to the shop.</li>
                <li>
                  The shop contacts you{business.responseTime ? ` ${business.responseTime}` : ""} to discuss the details.
                </li>
                <li>You agree on the next steps together.</li>
              </ol>
              {!business.responseTime && <p className="draft-note mt-4">Response time to be confirmed by the owner.</p>}
            </div>
            <div className="card text-sm text-ink-muted">
              <h2 className="text-lg font-bold">Please note</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>This is a request, not a booked appointment.</li>
                <li>No prices or quotes are confirmed online.</li>
                <li>No payment details are needed.</li>
              </ul>
              {hasPhone() && (
                <p className="mt-4">
                  Prefer to talk? Call{" "}
                  <a href={`tel:${business.phone}`} className="font-semibold text-amber-800 underline" data-track="phone-click">
                    {business.phoneDisplay}
                  </a>
                  .
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
