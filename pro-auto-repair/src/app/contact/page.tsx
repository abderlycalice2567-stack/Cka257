import type { Metadata } from "next";
import Link from "next/link";
import { business, primaryCta } from "@/config/business";
import { ContactPanel } from "@/components/ContactPanel";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${business.name}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" intro="The quickest way to start is a short service request." />
      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div className="card bg-navy-50">
            <h2 className="text-xl font-bold">Send a request</h2>
            <p className="mt-2 leading-relaxed text-muted">
              Describe your vehicle and what you need. The shop will follow up to discuss the details.
            </p>
            <Link href={primaryCta.href} className="btn-primary mt-5">{primaryCta.label}</Link>
          </div>
          <ContactPanel />
        </div>
      </section>
    </>
  );
}
