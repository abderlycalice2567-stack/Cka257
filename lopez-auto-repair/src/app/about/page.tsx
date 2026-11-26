import { business, isPreview } from "@/config/business";
import { CTA } from "@/components/CTA";
import { PageHeader } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description: `About ${business.name}: the business behind the service.`,
  path: "/about",
});

const pendingSections = [
  { title: "Our story", note: "Owner-approved history of the business." },
  { title: "The team", note: "Real team members and photos, with their permission." },
  { title: "Credentials", note: "Only certifications and affiliations the owner can document." },
  { title: "How we work", note: "The owner's service philosophy, in their own words." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="Meet the business behind the service" />
      <section className="section">
        <div className="container max-w-3xl">
          {business.story ? (
            <div className="space-y-5 text-lg leading-relaxed text-navy-600">
              {business.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          ) : isPreview ? (
            <>
              <p className="text-lg leading-relaxed text-navy-600">
                This page is reserved for {business.name}&apos;s own story. Nothing has been written on the owner&apos;s behalf — no history, staff, credentials or claims are shown until the owner supplies and approves them.
              </p>
              <h2 className="mt-12 text-2xl font-extrabold">Planned for this page</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {pendingSections.map((s) => (
                  <li key={s.title} className="draft-note">
                    <p className="font-display text-base font-bold text-navy-800">{s.title}</p>
                    <p className="mt-1">{s.note}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-lg leading-relaxed text-navy-600">More about {business.name} is coming soon.</p>
          )}
        </div>
      </section>
      <CTA />
    </>
  );
}
