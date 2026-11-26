import Link from "next/link";
import { business, primaryCta } from "@/config/business";
import { Logo } from "@/components/Logo";
import { navLinks } from "@/components/nav";
import { HoursList } from "@/components/ContactPanel";

export function Footer() {
  const hasContact = business.phone || business.email || business.address;
  return (
    <footer className="bg-navy-900 text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo inverse />
          <p className="mt-3 max-w-xs text-sm text-navy-100">
            Auto repair in {business.city ? `${business.city}, ` : ""}
            {business.region}.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Explore</h2>
          <ul className="mt-3 space-y-1">
            {[...navLinks, primaryCta, { href: "/privacy", label: "Privacy" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-[44px] items-center text-navy-100 underline-offset-4 hover:text-white hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {hasContact && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h2>
            <address className="mt-3 space-y-2 text-sm not-italic text-navy-100">
              {business.address && (
                <p>
                  {business.address.street}
                  <br />
                  {business.address.city}, {business.address.region} {business.address.postalCode}
                </p>
              )}
              {business.phone && (
                <p>
                  <a href={`tel:${business.phone}`} className="underline underline-offset-4 hover:text-white" data-track="phone-click">
                    {business.phoneDisplay ?? business.phone}
                  </a>
                </p>
              )}
              {business.email && (
                <p>
                  <a href={`mailto:${business.email}`} className="underline underline-offset-4 hover:text-white">
                    {business.email}
                  </a>
                </p>
              )}
            </address>
          </div>
        )}
        {business.hours && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Hours</h2>
            <HoursList hours={business.hours} className="mt-3 text-sm text-navy-100" />
          </div>
        )}
      </div>
      <div className="border-t border-white/15">
        <p className="container-page py-5 text-sm text-navy-100">
          © {new Date().getFullYear()} {business.name}
        </p>
      </div>
    </footer>
  );
}
