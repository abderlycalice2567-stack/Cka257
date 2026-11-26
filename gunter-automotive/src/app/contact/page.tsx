import type { Metadata } from "next";
import { ContactPanel } from "@/components/ContactPanel";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact details, hours and location for Gunter Automotive.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="Contact & hours" intro="The fastest way to reach the shop is a service request." />
      <section className="section pt-10">
        <div className="container">
          <ContactPanel />
        </div>
      </section>
    </>
  );
}
