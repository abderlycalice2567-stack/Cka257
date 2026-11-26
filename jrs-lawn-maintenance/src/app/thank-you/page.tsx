import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/config/business";
import { Container, buttonClass } from "@/components/ui";
import { serverEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Request received", robots: { index: false, follow: false } };

const RECEIPT = /^(JRS|DEMO)-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ r?: string | string[] }> }) {
  const sp = await searchParams;
  const receipt = typeof sp.r === "string" && RECEIPT.test(sp.r) ? sp.r : null;
  const demo = serverEnv().demoMode || receipt?.startsWith("DEMO-");
  const response = business.responseTime.verified && business.responseTime.value;

  return (
    <div className="bg-tan-light py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl rounded-card bg-white p-8 shadow-sm sm:p-12">
          {demo ? (
            <>
              <h1 className="font-heading text-3xl font-extrabold text-pine-ink sm:text-4xl">Demo submission complete</h1>
              <div role="note" className="mt-6 rounded-card border-2 border-dashed border-pine bg-tan-light p-4 text-pine-ink">
                <p className="font-heading font-bold">This request was not sent.</p>
                <p className="mt-1">This is a private prototype running in demo mode. Your answers passed validation, but nothing was saved and no one was notified.</p>
              </div>
              {receipt && <p className="mt-6 text-muted">Demo reference: <span className="font-mono font-semibold text-pine-ink">{receipt}</span></p>}
            </>
          ) : (
            <>
              <h1 className="font-heading text-3xl font-extrabold text-pine-ink sm:text-4xl">Thanks — we received your request</h1>
              {receipt && (
                <p className="mt-6 text-lg text-muted">
                  Your receipt number is <span className="font-mono font-semibold text-pine-ink">{receipt}</span>. Keep it in case you need to refer to this request.
                </p>
              )}
              <p className="mt-4 text-muted">The owner will review your request and contact you{response ? ` ${response}` : ""} to discuss the details.</p>
              <p className="mt-4 text-muted">
                <strong className="text-pine-ink">Please note:</strong> this is not an appointment or a quote. Nothing has been booked or priced yet.
              </p>
            </>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className={buttonClass("primary")}>
              Back to home
            </Link>
            <Link href="/services" className={buttonClass("secondary")}>
              Explore services
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
