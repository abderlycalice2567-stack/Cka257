import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { business } from "@/config/business";

export const metadata: Metadata = {
  title: "Request received",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ r?: string; demo?: string }> };

export default async function ThankYouPage({ searchParams }: Props) {
  const { r, demo } = await searchParams;
  const isDemo = demo === "1";
  const receipt = r && /^[A-Za-z0-9-]{8,80}$/.test(r) ? r.replace(/^demo-/, "").slice(0, 8).toUpperCase() : null;

  if (isDemo) {
    return (
      <>
        <PageHeader eyebrow="Demo mode" title="Demo submission: not sent" />
        <section className="section pt-10">
          <div className="container max-w-2xl space-y-4">
            <div className="rounded-card border-2 border-amber-800 bg-amber-100 p-6 text-amber-800" role="status">
              <p className="font-semibold">This preview has no database or email connected.</p>
              <p className="mt-2">
                Your details passed validation, but <strong>nothing was stored and nobody was contacted</strong>. In the real site, this request would
                be saved and the shop notified.
              </p>
              {receipt && <p className="mt-2 text-sm">Demo reference: {receipt}</p>}
            </div>
            <Link href="/" className="btn-secondary">
              Back to home
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Request received" title="Thanks, we've got your request" />
      <section className="section pt-10">
        <div className="container max-w-2xl space-y-6">
          <div className="card" role="status">
            <p className="text-lg">
              Your service request has been received{business.responseTime ? ` and the shop will contact you ${business.responseTime}` : " and the shop will contact you to discuss it"}.
            </p>
            {receipt && (
              <p className="mt-3 text-ink-muted">
                Your reference: <strong className="font-mono text-brand">{receipt}</strong>
              </p>
            )}
            <p className="mt-4 text-sm text-ink-muted">
              Please note: this isn&apos;t a confirmed appointment or quote. The shop will follow up to agree on next steps with you.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="btn-secondary">
              Back to home
            </Link>
            <Link href="/services" className="btn-secondary">
              Explore services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
