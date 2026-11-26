import Link from "next/link";
import type { Service } from "@/content/services";

const icons: Record<Service["slug"], React.ReactNode> = {
  "general-repair": <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
  diagnostics: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  maintenance: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4" />
    </>
  ),
};

export function ServiceCard({ service, headingLevel = "h3" }: { service: Service; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="card group relative flex h-full flex-col p-6 transition-shadow hover:shadow-lg">
      <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-lg bg-brand-tint text-brand">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {icons[service.slug]}
        </svg>
      </span>
      <Heading className="mt-5 text-xl font-bold">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:rounded-card">
          {service.name}
        </Link>
      </Heading>
      <p className="mt-2 flex-1 leading-relaxed text-navy-600">{service.summary}</p>
      <p aria-hidden="true" className="mt-5 font-semibold text-brand group-hover:underline">
        Learn more →
      </p>
    </article>
  );
}
