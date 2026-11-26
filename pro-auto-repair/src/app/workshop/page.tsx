import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { business } from "@/config/business";
import { showWorkshop } from "@/components/nav";
import { CTA } from "@/components/CTA";
import { Gallery } from "@/components/Gallery";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Workshop",
  description: `A look inside the ${business.name} workshop.`,
  alternates: { canonical: "/workshop" },
};

export default function WorkshopPage() {
  if (!showWorkshop) notFound();
  const anyIllustrative = business.gallery.some((g) => g.illustrative);
  return (
    <>
      <PageHeader eyebrow="Workshop" title="A look inside the workshop" />
      <section className="section">
        <div className="container-page">
          {anyIllustrative && (
            <p className="placeholder-note mb-8">
              Images marked “Illustrative” are placeholders drawn for this preview. They do not show the
              business and will be replaced with owner-approved photos.
            </p>
          )}
          <h2 className="sr-only">Photos</h2>
          <Gallery items={business.gallery} />
        </div>
      </section>
      <CTA />
    </>
  );
}
