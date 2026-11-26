import Link from "next/link";
import { business } from "@/config/business";
import { homeFaqs, visibleServices } from "@/content/services";
import { showWorkshop } from "@/components/nav";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceCard } from "@/components/ServiceCard";

export const metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  const services = visibleServices();
  const reviews = business.reviews;
  return (
    <>
      <Hero />

      {services.length > 0 && (
        <section className="section" aria-labelledby="services-heading">
          <div className="container-page">
            <p className="eyebrow">Services</p>
            <h2 id="services-heading" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">How we can help</h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {services.map((s) => (
                <li key={s.slug}>
                  <ServiceCard service={s} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section bg-navy-50" aria-labelledby="process-heading">
        <div className="container-page">
          <p className="eyebrow">How it works</p>
          <h2 id="process-heading" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Three simple steps</h2>
          <div className="mt-8">
            <ProcessSteps />
          </div>
        </div>
      </section>

      {showWorkshop && (
        <section className="section" aria-labelledby="workshop-heading">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Workshop</p>
                <h2 id="workshop-heading" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">A look inside</h2>
              </div>
              <Link href="/workshop" className="inline-flex min-h-[44px] items-center font-semibold text-teal underline underline-offset-4">
                See the workshop
              </Link>
            </div>
            <div className="mt-8">
              <Gallery items={business.gallery} />
            </div>
            {reviews.length > 0 && (
              <ul className="mt-10 grid gap-6 md:grid-cols-3">
                {reviews.map((r) => (
                  <li key={`${r.author}-${r.date}`} className="card">
                    <blockquote className="leading-relaxed text-ink">“{r.text}”</blockquote>
                    <p className="mt-4 text-sm text-muted">{r.author} · {r.source} · {r.date}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <section className="section bg-navy-50" aria-labelledby="about-heading">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">About</p>
          <h2 id="about-heading" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Meet the business behind the service.</h2>
          {business.story ? (
            <p className="mt-4 text-lg leading-relaxed text-muted">{business.story[0]}</p>
          ) : (
            <p className="placeholder-note mt-4">Preview note: the owner&apos;s approved story goes here.</p>
          )}
          <Link href="/about" className="btn-secondary mt-6">About {business.name}</Link>
        </div>
      </section>

      <section className="section">
        <div className="container-page max-w-3xl">
          <FAQ items={homeFaqs} />
        </div>
      </section>

      <CTA />
    </>
  );
}
