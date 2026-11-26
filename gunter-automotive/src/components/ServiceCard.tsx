import Link from "next/link";
import type { Service } from "@/content/services";
import { IconArrow, IconGauge, IconOil, IconWrench } from "@/components/Icons";
import { isLive } from "@/lib/site";

const icons = { maintenance: IconOil, diagnostics: IconGauge, repair: IconWrench };

export function ServiceCard({ service }: { service: Service }) {
  const Icon = icons[service.slug];
  return (
    <article className="card group relative flex h-full flex-col transition-shadow hover:shadow-lg">
      <span className="flex h-12 w-12 items-center justify-center rounded-card bg-brand-50 text-brand">
        <Icon />
      </span>
      <h3 className="mt-4 text-xl font-bold">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:rounded-card">
          {service.name}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-ink-muted">{service.summary}</p>
      <span className="mt-4 inline-flex items-center gap-1 font-semibold text-amber-800 group-hover:underline">
        Learn more <IconArrow />
      </span>
      {!service.approved && !isLive() && <span className="mt-3 text-xs font-medium text-ink-muted">Draft scope, pending owner approval</span>}
    </article>
  );
}
