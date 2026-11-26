import Link from "next/link";
import { business } from "@/config/business";
import { navItems } from "@/lib/site";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { Container, buttonClass } from "./ui";

/** Text wordmark only — no logo is used until the owner supplies one. */
export function Header() {
  const items = navItems().map(({ href, label }) => ({ href, label }));
  return (
    <header className="sticky top-0 z-30 border-b border-pine/15 bg-white/95 backdrop-blur">
      <Container className="relative flex min-h-[72px] items-center justify-between gap-4">
        <Link href="/" className="flex min-h-touch items-center gap-3 font-heading font-extrabold leading-tight text-pine-ink">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-pine text-sm text-tan">JRS</span>
          <span className="text-base sm:text-lg">
            <span className="hidden sm:inline">{business.name}</span>
            <span className="sm:hidden">{business.shortName}</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks
            items={items}
            className="flex items-center gap-1"
            linkClassName="inline-flex min-h-touch items-center rounded-card px-3 font-heading font-semibold text-pine-ink hover:bg-tan-light aria-[current=page]:text-pine aria-[current=page]:underline aria-[current=page]:underline-offset-8"
          />
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/request" className={buttonClass("primary", "hidden sm:inline-flex")}>
            Request lawn service
          </Link>
          <MobileMenu items={items} />
        </div>
      </Container>
    </header>
  );
}
