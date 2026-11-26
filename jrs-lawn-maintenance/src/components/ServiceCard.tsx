import Image from "next/image";
import Link from "next/link";
import type { Service } from "@/content/services";

export function ServiceCard({ service, headingLevel = "h3" }: { service: Service; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-pine/15 bg-white shadow-sm transition-shadow focus-within:shadow-md hover:shadow-md">
      <Image src={service.image.src} alt="" width={600} height={400} unoptimized className="h-auto w-full" />
      <div className="flex flex-1 flex-col p-6">
        <H className="font-heading text-xl font-bold text-pine-ink">
          <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {service.name}
          </Link>
        </H>
        <p className="mt-2 flex-1 text-muted">{service.summary}</p>
        <span aria-hidden="true" className="mt-4 font-heading font-bold text-pine group-hover:underline">
          Learn more →
        </span>
      </div>
    </article>
  );
}
