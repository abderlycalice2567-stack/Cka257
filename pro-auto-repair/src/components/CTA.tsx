import Link from "next/link";
import { primaryCta } from "@/config/business";

export function CTA({
  title = "Ready to discuss your needs?",
  text = "Send a short request. Nothing is booked until you and the shop agree on next steps.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="bg-navy">
      <div className="container-page flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between lg:py-16">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">{title}</h2>
          <p className="mt-2 max-w-xl text-lg text-navy-100">{text}</p>
        </div>
        <Link href={primaryCta.href} className="btn-inverse shrink-0">
          {primaryCta.label}
        </Link>
      </div>
    </section>
  );
}
