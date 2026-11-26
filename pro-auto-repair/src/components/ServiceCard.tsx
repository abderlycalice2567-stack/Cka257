import Link from "next/link";
import type { Service } from "@/content/services";

const icons: Record<string, string> = {
  diagnostics: "M4 13h4l2-6 4 12 2-6h4",
  "general-repairs": "M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-3 3-2-2z",
  "preventive-maintenance": "M12 3v4M5 8h14v11H5zM9 13l2 2 4-4",
};

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="card relative flex h-full flex-col transition-shadow focus-within:shadow-md hover:shadow-md">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icons[service.slug] ?? icons.diagnostics} />
        </svg>
      </span>
      <h3 className="mt-4 text-xl font-bold">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:rounded-card">
          {service.name}
        </Link>
      </h3>
      <p className="mt-2 flex-1 leading-relaxed text-muted">{service.summary}</p>
      <p className="mt-4 font-semibold text-teal" aria-hidden="true">
        Learn more →
      </p>
    </article>
  );
}
