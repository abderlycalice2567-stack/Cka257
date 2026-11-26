import Link from "next/link";
import { business } from "@/config/business";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Request received", description: "Service request receipt.", path: "/thank-you", noindex: true });

export const dynamic = "force-dynamic";

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ receipt?: string | string[]; demo?: string | string[] }> }) {
  const sp = await searchParams;
  const receipt = typeof sp.receipt === "string" && /^LAR-[0-9A-F]{10}$/.test(sp.receipt) ? sp.receipt : null;
  const demo = sp.demo === "1";

  // Demo: never claim anything was sent.
  if (demo) {
    return (
      <section className="container section max-w-2xl">
        <p className="eyebrow">Demo mode</p>
        <h1 className="mt-2 text-4xl font-extrabold">Nothing was sent</h1>
        <p className="mt-4 text-lg leading-relaxed text-navy-600">
          The form worked and your entries passed validation, but this preview isn&apos;t connected to {business.name}. Your details were <strong className="text-navy-800">not stored and not sent to anyone</strong>, and nobody will contact you.
        </p>
        <p className="mt-4 leading-relaxed text-navy-600">On the live site, this page shows a receipt for the request instead.</p>
        <Link href="/" className="btn-secondary mt-8">
          Back to homepage
        </Link>
      </section>
    );
  }

  // Reached directly, without a submission.
  if (!receipt) {
    return (
      <section className="container section max-w-2xl">
        <h1 className="text-4xl font-extrabold">No request to show</h1>
        <p className="mt-4 text-lg leading-relaxed text-navy-600">This page shows a receipt after you send a service request. It looks like you arrived here another way.</p>
        <Link href="/request" className="btn-primary mt-8">
          Request service
        </Link>
      </section>
    );
  }

  return (
    <section className="container section max-w-2xl">
      <p className="eyebrow">Request received</p>
      <h1 className="mt-2 text-4xl font-extrabold">Thanks — we have your request</h1>
      <p className="mt-4 text-lg leading-relaxed text-navy-600">
        {business.name} will follow up using the contact details you provided.
        {business.responseExpectation ? ` ${business.responseExpectation}` : ""}
      </p>
      <dl className="mt-8 rounded-card border border-navy-100 bg-navy-50 p-5">
        <dt className="text-sm font-semibold text-navy-600">Receipt reference</dt>
        <dd className="mt-1 font-display text-2xl font-bold tracking-wide">{receipt}</dd>
      </dl>
      <p className="mt-6 leading-relaxed text-navy-600">
        <strong className="text-navy-800">This is a receipt only.</strong> It doesn&apos;t confirm an appointment, a preferred date or a quote — those are agreed with you directly.
      </p>
      <Link href="/" className="btn-secondary mt-8">
        Back to homepage
      </Link>
    </section>
  );
}
