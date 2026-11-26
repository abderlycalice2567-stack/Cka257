import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Request received",
  robots: { index: false, follow: false },
};

type Props = { searchParams: { mode?: string; ref?: string } };

export default function ThankYouPage({ searchParams }: Props) {
  const demo = searchParams.mode === "demo";
  const live = searchParams.mode === "live";
  const ref = live && /^[A-Z0-9]{6,16}$/.test(searchParams.ref ?? "") ? searchParams.ref : null;

  return (
    <section className="section">
      <div className="container-page max-w-2xl">
        {demo ? (
          <>
            <p className="eyebrow">Demo mode</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Your answers passed the checks</h1>
            <p className="mt-4 rounded-lg border-2 border-[#8A6D00] bg-[#FFF4CC] px-4 py-3 text-[#4A3A00]">
              <strong>Nothing was stored or sent.</strong> This preview has no backend connected, so no one
              has received a request and no one will contact you.
            </p>
          </>
        ) : live ? (
          <>
            <p className="eyebrow">Request received</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Thanks — we have your request</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              This is a receipt for your request. It is not an appointment or a quote. The shop will contact
              you to discuss the details and agree on next steps.
            </p>
            {ref && (
              <p className="mt-4">
                Receipt reference: <strong className="font-mono text-navy">{ref}</strong>
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Service requests</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              This page is shown after a service request is sent. To start one, use the request form.
            </p>
          </>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn-primary">Back to home</Link>
          {!live && <Link href="/request" className="btn-secondary">Go to the request form</Link>}
        </div>
      </div>
    </section>
  );
}
