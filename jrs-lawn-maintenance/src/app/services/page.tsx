import { isPrototype } from "@/config/business";
import { CTA } from "@/components/CTA";
import { ServiceCard } from "@/components/ServiceCard";
import { DraftNote, Section } from "@/components/ui";
import { visibleServices } from "@/content/services";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Lawn Services",
  description: "Lawn mowing, edging and routine lawn maintenance. See what each service covers and request the one you need.",
  path: "/services",
});

export default function ServicesPage() {
  const services = visibleServices();
  return (
    <>
      <Section labelledBy="page-title" tone="cream">
        <h1 id="page-title" className="font-heading text-4xl font-extrabold text-pine-ink sm:text-5xl">
          Services
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">Straightforward lawn maintenance for homeowners who want a yard that looks cared for — without an elaborate landscaping project.</p>
      </Section>
      <Section labelledBy="services-list">
        <h2 id="services-list" className="sr-only">
          All services
        </h2>
        <ul className="grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <li key={s.slug}>
              <ServiceCard service={s} />
            </li>
          ))}
        </ul>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {services.map((s) => (
            <div key={s.slug}>
              <h3 className="font-heading text-lg font-bold text-pine-ink">{s.name}: proposed scope</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
                {s.scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {isPrototype() && <DraftNote>service scope is a proposal. The owner confirms what&apos;s included before launch.</DraftNote>}
      </Section>
      <CTA />
    </>
  );
}
