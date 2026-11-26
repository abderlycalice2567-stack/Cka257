import Link from "next/link";
import { business, hasPhone, locationLabel } from "@/config/business";
import { Logo } from "@/components/Logo";
import { HoursList } from "@/components/ContactPanel";
import { navItems } from "@/lib/site";

export function Footer() {
  return (
    <footer className="on-dark bg-brand pb-28 pt-14 text-cream md:pb-10">
      <div className="container grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo onDark />
          <p className="mt-4 max-w-xs text-sm text-brand-100">{business.address.city ? `${business.tagline}. Serving ${locationLabel()}.` : `${business.tagline}.`}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-amber-300">Explore</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[...navItems(), { href: "/request", label: "Request service" }, { href: "/privacy", label: "Privacy" }].map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="inline-flex min-h-touch items-center text-cream/90 hover:text-amber-300 md:min-h-0 md:py-1">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-amber-300">Contact &amp; hours</h2>
          <div className="mt-3 space-y-2 text-sm text-brand-100">
            {hasPhone() ? (
              <a href={`tel:${business.phone}`} className="font-semibold text-cream hover:text-amber-300" data-track="phone-click">
                {business.phoneDisplay}
              </a>
            ) : (
              <p>Phone number to be confirmed. Please use the request form.</p>
            )}
            <HoursList onDark />
          </div>
        </div>
      </div>
      <div className="container mt-10 border-t border-white/15 pt-6 text-xs text-brand-100">
        © {new Date().getFullYear()} {business.legalName ?? business.name}. All rights reserved.
      </div>
    </footer>
  );
}
