import { randomUUID } from "node:crypto";
import { business, isPreview } from "@/config/business";
import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { isDemoMode } from "@/lib/leads/env";
import { SERVICE_OPTIONS, todayIso } from "@/lib/leads/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Request service",
  description: "Tell us about your vehicle and what you're noticing. A request starts the conversation — it isn't a booking.",
  path: "/request",
});

// Rendered per request: demo-mode status and the idempotency key must be fresh.
export const dynamic = "force-dynamic";

const fallbackErrors: Record<string, string> = {
  invalid: "Some details were missing or invalid. Please check the form and try again.",
  rate: "Too many requests. Please wait a few minutes and try again.",
  unavailable: "We couldn't save your request right now. Please try again in a moment.",
};

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ service?: string | string[]; error?: string | string[] }> }) {
  const sp = await searchParams;
  const requested = typeof sp.service === "string" ? sp.service : undefined;
  const defaultService = SERVICE_OPTIONS.some((o) => o.value === requested) ? requested : undefined;
  const initialError = typeof sp.error === "string" ? (fallbackErrors[sp.error] ?? null) : null;

  return (
    <>
      <PageHeader eyebrow="Request service" title="Tell us what you need" intro="Share a few details about your vehicle and what's going on. This is a request to start the conversation — not a booking or a quote." />
      <section className="section">
        <div className="container grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <RequestForm demo={isDemoMode()} idempotencyKey={randomUUID()} today={todayIso()} defaultService={defaultService} initialError={initialError} businessName={business.name} />
          </div>
          <aside className="md:col-span-4 md:col-start-9" aria-labelledby="request-next">
            <div className="card p-6 md:sticky md:top-24">
              <h2 id="request-next" className="text-xl font-bold">
                What happens next
              </h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed text-navy-600">
                <li>You&apos;ll see a receipt confirming your request was received.</li>
                <li>{business.name} follows up using the phone number or email you provide.</li>
                <li>Timing, cost and next steps are agreed with you directly.</li>
              </ol>
              {business.responseExpectation ? (
                <p className="mt-4 leading-relaxed">{business.responseExpectation}</p>
              ) : isPreview ? (
                <p className="draft-note mt-4">Response-time wording goes here once the owner approves it. No response time is promised until then.</p>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
