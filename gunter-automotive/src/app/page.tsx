import Link from "next/link";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { Placeholder } from "@/components/Placeholder";
import { ServiceCard } from "@/components/ServiceCard";
import { IconArrow } from "@/components/Icons";
import { business } from "@/config/business";
import { homepageFaq, processSteps } from "@/content/faq";
import { approvedWorkshopPhotos } from "@/content/workshop";
import { JsonLd } from "@/components/JsonLd";
import { isLive, showWorkshop, visibleServices } from "@/lib/site";

export default function HomePage() {
  const svc = visibleServices();
  const photos = approvedWorkshopPhotos();
  // Proof module: only real, approved photos/reviews in live mode; labelled placeholders in the preview.
  const showProof = photos.length > 0 || (!isLive() && showWorkshop());

  return (
    <>
      <JsonLd />
      <Hero />

      {svc.length > 0 && (
        <section className="section" aria-labelledby="services-title">
          <div className="container">
            <p className="eyebrow">Services</p>
            <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 id="services-title" className="text-3xl font-extrabold sm:text-4xl">
                What can we help with?
              </h2>
              <Link href="/services" className="inline-flex min-h-touch items-center gap-1 font-semibold text-amber-800 hover:underline">
                All services <IconArrow />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {svc.map((s) => (
                <ServiceCard key={s.slug} service={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section bg-white" aria-labelledby="process-title">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2 id="process-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Three simple steps
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {processSteps.map((step, i) => (
              <li key={step.title} className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand font-display text-xl font-extrabold text-amber-300" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-ink-muted">Submitting a request doesn&apos;t automatically book an appointment.</p>
        </div>
      </section>

      {showProof && (
        <section className="section" aria-labelledby="workshop-title">
          <div className="container grid items-center gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="eyebrow">The workshop</p>
              <h2 id="workshop-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
                See where the work happens
              </h2>
              <p className="mt-4 text-ink-muted">A look inside the shop{isLive() ? "." : ". Photos will be replaced with owner-approved images before launch."}</p>
              <Link href="/workshop" className="btn-secondary mt-6">
                Visit the workshop
              </Link>
            </div>
            <div className="md:col-span-7">
              {photos.length > 0 ? (
                <Gallery photos={photos.slice(0, 2)} />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Placeholder label="service bay" tone="cream" className="aspect-square" />
                  <Placeholder label="technician at work" tone="cream" className="aspect-square translate-y-6" />
                </div>
              )}
            </div>
          </div>
          {/* Reviews module intentionally omitted: there are no verified reviews. Add only real, attributable reviews. */}
        </section>
      )}

      <section className="section bg-white" aria-labelledby="about-title">
        <div className="container max-w-3xl text-center">
          <p className="eyebrow">About</p>
          <h2 id="about-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Meet the business behind the service
          </h2>
          {business.story ? (
            <p className="mt-4 text-lg text-ink-muted">{business.story}</p>
          ) : (
            <p className="draft-note mx-auto mt-6 max-w-xl">Owner-approved story to be added. No team, history or credentials are claimed here.</p>
          )}
          <Link href="/about" className="mt-6 inline-flex min-h-touch items-center gap-1 font-semibold text-amber-800 hover:underline">
            More about {business.name} <IconArrow />
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-3xl">
          <FAQ items={homepageFaq} />
        </div>
      </section>

      <CTA />
    </>
  );
}
