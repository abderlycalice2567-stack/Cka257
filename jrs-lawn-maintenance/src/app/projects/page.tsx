import { notFound } from "next/navigation";
import { business } from "@/config/business";
import { CTA } from "@/components/CTA";
import { Gallery } from "@/components/Gallery";
import { Section } from "@/components/ui";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Projects",
  description: `Recent lawn maintenance work by ${business.name}.`,
  path: "/projects",
});

/** Only exists once the owner supplies approved photos (business.projects). */
export default function ProjectsPage() {
  if (business.projects.length === 0) notFound();
  return (
    <>
      <Section labelledBy="page-title" tone="cream">
        <h1 id="page-title" className="font-heading text-4xl font-extrabold text-pine-ink sm:text-5xl">
          Projects
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">A look at recent work.</p>
      </Section>
      <Section labelledBy="gallery-title">
        <h2 id="gallery-title" className="sr-only">
          Project photos
        </h2>
        <Gallery photos={business.projects} />
      </Section>
      <CTA />
    </>
  );
}
