import { business, isPrototype } from "@/config/business";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { Gallery } from "@/components/Gallery";
import { Hero } from "@/components/Hero";
import { Process } from "@/components/Process";
import { ServiceCard } from "@/components/ServiceCard";
import { ButtonLink, DraftNote, Eyebrow, Section } from "@/components/ui";
import { homeFaq, visibleServices } from "@/content/services";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: `${business.name} | Lawn Maintenance in Athens, GA`,
  description: "Dependable, recurring lawn mowing, edging and routine maintenance. Tell us what you need with a simple request.",
  path: "/",
});

export default function HomePage() {
  const prototype = isPrototype();
  const hasProjects = business.projects.length > 0;
  const hasReviews = business.reviews.length > 0;
  return (
    <>
      <Hero />

      <Section labelledBy="services-title">
        <Eyebrow>Services</Eyebrow>
        <h2 id="services-title" className="font-heading text-3xl font-extrabold text-pine-ink">
          Simple, dependable lawn care
        </h2>
        <p className="mt-3 max-w-2xl text-muted">Focused on regular upkeep — the routine work that keeps a yard looking cared for week after week.</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {visibleServices().map((s) => (
            <li key={s.slug}>
              <ServiceCard service={s} />
            </li>
          ))}
        </ul>
        {prototype && <DraftNote>service list is proposed from research. Services the owner doesn&apos;t approve will be hidden at launch.</DraftNote>}
      </Section>

      <Section labelledBy="process-title" tone="cream">
        <Process />
      </Section>

      {(hasProjects || hasReviews) && (
        <Section labelledBy="proof-title">
          <h2 id="proof-title" className="font-heading text-3xl font-extrabold text-pine-ink">
            Recent work
          </h2>
          {hasProjects && (
            <div className="mt-8">
              <Gallery photos={business.projects} limit={3} />
              <ButtonLink href="/projects" variant="secondary" className="mt-6">
                See more projects
              </ButtonLink>
            </div>
          )}
          {hasReviews && (
            <ul className="mt-10 grid gap-6 md:grid-cols-2">
              {business.reviews.map((r) => (
                <li key={`${r.author}-${r.date}`}>
                  <figure className="h-full rounded-card border border-pine/15 bg-tan-light p-6">
                    <blockquote className="text-pine-ink">“{r.text}”</blockquote>
                    <figcaption className="mt-3 text-sm text-muted">
                      — {r.author}, via {r.source}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section labelledBy="about-title" tone={hasProjects || hasReviews ? "cream" : "white"}>
        <div className="max-w-3xl">
          <Eyebrow>About</Eyebrow>
          <h2 id="about-title" className="font-heading text-3xl font-extrabold text-pine-ink">
            Meet the business behind the service
          </h2>
          {business.aboutStory.length > 0 ? (
            <p className="mt-4 text-lg text-muted">{business.aboutStory[0]}</p>
          ) : (
            <p className="mt-4 text-lg text-muted">A local lawn maintenance business focused on dependable, recurring care for homeowners.</p>
          )}
          {prototype && business.aboutStory.length === 0 && <DraftNote>replace with the owner&apos;s own story.</DraftNote>}
          <ButtonLink href="/about" variant="secondary" className="mt-6">
            About us
          </ButtonLink>
        </div>
      </Section>

      <Section labelledBy="faq-title" tone={hasProjects || hasReviews ? "white" : "cream"}>
        <div className="max-w-3xl">
          <FAQ items={homeFaq} />
          {prototype && <DraftNote>answers marked as pending will come from the owner. No prices or policies are stated.</DraftNote>}
        </div>
      </Section>

      <CTA />
    </>
  );
}
