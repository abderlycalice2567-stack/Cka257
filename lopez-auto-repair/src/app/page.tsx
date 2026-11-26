import Link from "next/link";
import { business, isPreview } from "@/config/business";
import { gallery, homeFaq, services } from "@/content/services";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { ProcessSteps } from "@/components/ProcessSteps";
import { ServiceCard } from "@/components/ServiceCard";

export const metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  const hasProof = gallery.length > 0 || business.reviews.length > 0;
  const showAbout = business.story !== null || isPreview;
  return (
    <>
      <Hero />

      {services.length > 0 ? (
        <section className="section" aria-labelledby="home-services">
          <div className="container">
            <p className="eyebrow">Services</p>
            <h2 id="home-services" className="mt-2 text-3xl font-extrabold md:text-4xl">
              How we can help
            </h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {services.map((s) => (
                <li key={s.slug}>
                  <ServiceCard service={s} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section bg-navy-50" aria-labelledby="home-process">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2 id="home-process" className="mt-2 text-3xl font-extrabold md:text-4xl">
            Three simple steps
          </h2>
          <div className="mt-10">
            <ProcessSteps />
          </div>
        </div>
      </section>

      {hasProof ? (
        <section className="section" aria-labelledby="home-workshop">
          <div className="container">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Workshop</p>
                <h2 id="home-workshop" className="mt-2 text-3xl font-extrabold md:text-4xl">
                  A look at the shop
                </h2>
              </div>
              {gallery.length > 0 ? (
                <Link href="/workshop" className="inline-flex min-h-[44px] items-center font-semibold text-brand underline underline-offset-4">
                  See the workshop
                </Link>
              ) : null}
            </div>
            <div className="mt-10">
              <Gallery limit={3} />
            </div>
            {business.reviews.length > 0 ? (
              <ul className="mt-12 grid gap-6 md:grid-cols-3">
                {business.reviews.map((r) => (
                  <li key={r.quote} className="card p-6">
                    <blockquote className="leading-relaxed">“{r.quote}”</blockquote>
                    <p className="mt-4 text-sm text-navy-600">
                      {r.author} · {r.source}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {showAbout ? (
        <section className="section bg-navy-50" aria-labelledby="home-about">
          <div className="container grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <p className="eyebrow">About</p>
              <h2 id="home-about" className="mt-2 text-3xl font-extrabold md:text-4xl">
                Meet the business behind the service
              </h2>
              {business.story ? (
                <p className="mt-4 text-lg leading-relaxed text-navy-600">{business.story[0]}</p>
              ) : (
                <p className="draft-note mt-5 bg-white">The owner&apos;s story goes here once approved. Nothing about the business, its team or its history is shown until the owner provides it.</p>
              )}
            </div>
            <div className="md:col-span-5 md:text-right">
              <Link href="/about" className="btn-secondary">
                About {business.name}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="home-faq">
        <div className="container grid gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow">FAQ</p>
            <h2 id="home-faq" className="mt-2 text-3xl font-extrabold md:text-4xl">
              Common questions
            </h2>
          </div>
          <div className="md:col-span-8">
            <FAQ items={homeFaq} />
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}
