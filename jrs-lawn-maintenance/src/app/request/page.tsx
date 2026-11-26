import { business, isPrototype } from "@/config/business";
import { RequestForm } from "@/components/RequestForm";
import { Container, DraftNote } from "@/components/ui";
import { SERVICE_OPTIONS } from "@/lib/leads/schema";
import { serverEnv } from "@/lib/env";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Request Lawn Service",
  description: "Tell us about your yard and the lawn service you need. The owner will follow up to discuss the details.",
  path: "/request",
});

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const sp = await searchParams;
  const requested = typeof sp.service === "string" ? sp.service : undefined;
  const initialService = SERVICE_OPTIONS.some((o) => o.value === requested) ? requested : undefined;
  const { demoMode } = serverEnv();
  const response = business.responseTime.verified && business.responseTime.value;

  return (
    <div className="bg-tan-light py-14 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h1 className="font-heading text-4xl font-extrabold text-pine-ink sm:text-5xl">Request lawn service</h1>
          <p className="mt-4 text-lg text-muted">Tell us what you need. It takes about two minutes.</p>
          <h2 className="mt-8 font-heading text-xl font-bold text-pine-ink">What happens next</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
            <li>You get a receipt confirming your request was received.</li>
            <li>The owner reviews it and contacts you{response ? ` ${response}` : ""} to discuss the details.</li>
            <li>You agree together on next steps. Nothing is booked automatically.</li>
          </ol>
          {isPrototype() && !response && <DraftNote>the owner&apos;s expected response time will be added here once approved.</DraftNote>}
        </div>
        <div className="rounded-card bg-white p-6 shadow-sm sm:p-10 lg:col-span-8">
          <RequestForm demo={demoMode} initialService={initialService} />
        </div>
      </Container>
    </div>
  );
}
