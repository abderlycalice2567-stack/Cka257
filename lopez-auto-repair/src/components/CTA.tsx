import Link from "next/link";
import { business, formatPhone } from "@/config/business";

export function CTA({ title = "Ready to discuss your needs?", body = "Send a short request and start the conversation. It's a request, not a booking — nothing is scheduled until you agree." }: { title?: string; body?: string }) {
  return (
    <section className="on-dark bg-navy-800">
      <div className="container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
        <div>
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">{title}</h2>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-navy-100">{body}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/request" className="btn-primary">
            Request service
          </Link>
          {business.phone ? (
            <a href={`tel:${business.phone}`} className="btn-on-dark" data-track="phone-click">
              Call {formatPhone(business.phone)}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
