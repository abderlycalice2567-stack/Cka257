import Link from "next/link";
import { Placeholder } from "@/components/Placeholder";
import { IconArrow } from "@/components/Icons";
import { isLive } from "@/lib/site";

export function Hero() {
  // TODO(owner): add an approved hero photo for live mode; until then the hero is text-only.
  const showImage = !isLive();
  return (
    <section className="on-dark relative overflow-hidden bg-brand text-cream">
      <div className="container grid items-center gap-10 py-14 md:grid-cols-12 md:py-24">
        <div className={showImage ? "md:col-span-6" : "md:col-span-8"}>
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">Auto care in Georgia</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-cream sm:text-5xl lg:text-[3.5rem]">
            A better way to schedule your auto care
          </h1>
          <p className="mt-5 max-w-xl text-lg text-brand-100">
            Explore our services and tell us what you need. Start with a simple request.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/request" className="btn-primary">
              Schedule a service request <IconArrow />
            </Link>
            <Link href="/services" className="btn-on-dark">
              Explore services
            </Link>
          </div>
          <p className="mt-4 text-sm text-brand-200">A request isn&apos;t a booking. The shop will follow up to agree on next steps.</p>
        </div>
        {showImage && (
        <div className="md:col-span-6">
          <Placeholder label="shop exterior or technician photo" className="aspect-[4/3] w-full ring-1 ring-white/10" />
        </div>
        )}
      </div>
    </section>
  );
}
