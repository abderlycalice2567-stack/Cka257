import type { Metadata } from "next";
import { CTA } from "@/components/CTA";
import { PageHeader } from "@/components/PageHeader";
import { Placeholder } from "@/components/Placeholder";
import { business } from "@/config/business";

export const metadata: Metadata = {
  title: "About",
  description: "Meet the business behind Gunter Automotive.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="Meet the business behind the service" />
      <section className="section">
        <div className="container grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <h2 className="text-2xl font-bold">Our story</h2>
            {business.story ? (
              <div className="prose-body mt-4">
                {business.story.split("\n\n").map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
              </div>
            ) : (
              <p className="draft-note mt-4">
                Owner-approved story goes here: how the business started, what matters to them, and how they like to work with customers.
              </p>
            )}

            <h2 className="mt-12 text-2xl font-bold">The team</h2>
            <p className="draft-note mt-4">Team members, roles and photos will be added only with each person&apos;s permission.</p>

            <h2 className="mt-12 text-2xl font-bold">Credentials</h2>
            <p className="draft-note mt-4">
              Certifications, affiliations or warranties will be listed only once the owner provides proof. Nothing is claimed in this prototype.
            </p>

            <h2 className="mt-12 text-2xl font-bold">How we like to work</h2>
            <p className="mt-4 text-ink-muted">
              Every request starts with a conversation. You tell us what&apos;s going on, we talk through the details, and nothing moves forward until
              you&apos;ve agreed on the next steps.
            </p>
          </div>
          <div className="md:col-span-5">
            <Placeholder label="owner or team photo" tone="cream" className="aspect-[4/5] w-full" />
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
