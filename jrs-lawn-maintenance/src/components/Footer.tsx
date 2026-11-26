import Link from "next/link";
import { business, isHoursVerified, isPhoneVerified } from "@/config/business";
import { visibleServices } from "@/content/services";
import { navItems } from "@/lib/site";
import { Container } from "./ui";

export function Footer() {
  const loc = business.location;
  return (
    <footer className="bg-pine-ink pb-28 pt-14 text-white sm:pb-14">
      <Container className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-heading text-xl font-extrabold">{business.name}</p>
          <p className="mt-3 max-w-sm text-white/85">Dependable, recurring lawn maintenance{loc.verified ? ` in ${loc.value.locality}, ${loc.value.region}` : ""}.</p>
          <dl className="mt-5 space-y-2 text-white/90">
            {isPhoneVerified() && (
              <div>
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a className="underline underline-offset-4 hover:text-tan" href={`tel:${business.phone.value.e164}`} data-track="phone-click">
                    {business.phone.value.display}
                  </a>
                </dd>
              </div>
            )}
            {isHoursVerified() && (
              <div>
                <dt className="font-semibold">Hours</dt>
                {business.hours.value.map((h) => (
                  <dd key={h.days}>
                    {h.days}: {h.open}–{h.close}
                  </dd>
                ))}
              </div>
            )}
          </dl>
        </div>
        <nav aria-label="Services" className="md:col-span-3">
          <p className="font-heading font-bold text-tan">Services</p>
          <ul className="mt-3 space-y-1">
            {visibleServices().map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="inline-flex min-h-touch items-center hover:text-tan hover:underline">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer" className="md:col-span-4">
          <p className="font-heading font-bold text-tan">Company</p>
          <ul className="mt-3 space-y-1">
            {[{ href: "/", label: "Home" }, ...navItems(), { href: "/request", label: "Request lawn service" }, { href: "/privacy", label: "Privacy" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="inline-flex min-h-touch items-center hover:text-tan hover:underline">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="mt-10 border-t border-white/20 pt-6 text-sm text-white/80">
        <p>© {new Date().getFullYear()} {business.name}. Images on this site are illustrative.</p>
      </Container>
    </footer>
  );
}
