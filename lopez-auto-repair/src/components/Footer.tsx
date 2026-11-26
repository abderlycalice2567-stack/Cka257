import Link from "next/link";
import { business, formatPhone, isPreview, locationLabel } from "@/config/business";
import { Logo } from "./Logo";
import { navLinks } from "./nav";

export function Footer() {
  const { phone, email, hours, address } = business;
  return (
    <footer className="on-dark bg-navy-800 pb-24 text-navy-100 md:pb-0">
      <div className="container grid gap-10 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo onDark />
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-navy-200">
            Auto repair in {locationLabel()}
            {isPreview && !address.confirmed ? " (location to be confirmed)" : ""}. Start with a simple service request.
          </p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Explore</h2>
          <ul className="mt-3">
            {[...navLinks, { href: "/request", label: "Request service" }, { href: "/privacy", label: "Privacy" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-[44px] items-center text-[15px] text-navy-100 underline-offset-4 hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-[15px]">
            {phone ? (
              <li>
                <a href={`tel:${phone}`} className="inline-flex min-h-[44px] items-center text-white underline underline-offset-4" data-track="phone-click">
                  {formatPhone(phone)}
                </a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="inline-flex min-h-[44px] items-center text-white underline underline-offset-4">
                  {email}
                </a>
              </li>
            ) : null}
            {hours ? (
              <li>
                <Link href="/contact" className="inline-flex min-h-[44px] items-center text-white underline underline-offset-4">
                  See opening hours
                </Link>
              </li>
            ) : null}
            {!phone && !email && !hours && isPreview ? (
              <li className="rounded-lg border border-dashed border-white/30 px-4 py-3 text-sm text-navy-200">
                Phone, hours and address appear here once the owner confirms them.
              </li>
            ) : null}
            <li>
              <Link href="/request" className="inline-flex min-h-[44px] items-center text-white underline underline-offset-4">
                Send a service request
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container flex flex-col gap-1 py-5 text-sm text-navy-200 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {business.name}
          </p>
          {isPreview ? <p>Private preview — not an official website.</p> : null}
        </div>
      </div>
    </footer>
  );
}
