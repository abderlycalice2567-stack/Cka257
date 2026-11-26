import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CTA } from "@/components/CTA";
import { Gallery } from "@/components/Gallery";
import { PageHeader } from "@/components/PageHeader";
import { approvedWorkshopPhotos, workshopPhotos } from "@/content/workshop";
import { isLive, showWorkshop } from "@/lib/site";

export const metadata: Metadata = {
  title: "Workshop",
  description: "A look inside the Gunter Automotive workshop.",
  alternates: { canonical: "/workshop" },
};

export default function WorkshopPage() {
  if (!showWorkshop()) notFound();
  const photos = isLive() ? approvedWorkshopPhotos() : workshopPhotos;
  return (
    <>
      <PageHeader eyebrow="Workshop" title="Inside the workshop" intro="Where your vehicle is looked after." />
      <section className="section">
        <div className="container">
          {!isLive() && <p className="draft-note mb-8">All images below are illustrative placeholders. They&apos;ll be replaced with owner-approved photos before launch.</p>}
          <Gallery photos={photos} />
        </div>
      </section>
      <CTA />
    </>
  );
}
