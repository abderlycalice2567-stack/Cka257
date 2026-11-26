import { notFound } from "next/navigation";
import { isPreview } from "@/config/business";
import { gallery } from "@/content/services";
import { CTA } from "@/components/CTA";
import { Gallery } from "@/components/Gallery";
import { PageHeader } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Workshop", description: "A look inside the workshop.", path: "/workshop" });

export default function WorkshopPage() {
  // The route is omitted entirely when there are no gallery assets.
  if (gallery.length === 0) notFound();
  return (
    <>
      <PageHeader eyebrow="Workshop" title="A look at the shop" intro={isPreview ? undefined : "Where the work happens."} />
      <section className="section">
        <div className="container">
          {isPreview ? (
            <p className="draft-note mb-8">
              These are illustrations standing in for photography — they do not depict the real premises, vehicles or staff. They will be replaced with owner-approved photos and captions.
            </p>
          ) : null}
          <Gallery />
        </div>
      </section>
      <CTA />
    </>
  );
}
