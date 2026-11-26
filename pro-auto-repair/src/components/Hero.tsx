import Link from "next/link";
import { business, primaryCta } from "@/config/business";
import { GalleryFigure } from "@/components/Gallery";

export function Hero() {
  const image = business.gallery[0];
  return (
    <section className="bg-navy-50">
      <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-6">
          <p className="eyebrow">Auto repair in {business.region}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Get back on the road with confidence
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Explore our services and tell us what you need. Start with a simple request.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={primaryCta.href} className="btn-primary">
              {primaryCta.label}
            </Link>
            <Link href="/services" className="btn-secondary">
              Explore services
            </Link>
          </div>
        </div>
        {image && (
          <div className="lg:col-span-6">
            <GalleryFigure item={image} priority />
          </div>
        )}
      </div>
    </section>
  );
}
