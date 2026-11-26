import Link from "next/link";
import { business, hasPhone } from "@/config/business";
import { IconArrow } from "@/components/Icons";

export function CTA({ title = "Ready to discuss your needs?", body = "Send a short request and the shop will follow up to talk it through." }: { title?: string; body?: string }) {
  return (
    <section className="on-dark bg-brand text-cream">
      <div className="container flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-cream">{title}</h2>
          <p className="mt-2 max-w-xl text-brand-100">{body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/request" className="btn-primary">
            Schedule a service request <IconArrow />
          </Link>
          {hasPhone() && (
            <a href={`tel:${business.phone}`} className="btn-on-dark" data-track="phone-click">
              Call {business.phoneDisplay}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
