import Link from "next/link";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { navLinks } from "./nav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-[15px] font-medium text-navy-700 hover:text-brand">
              {l.label}
            </Link>
          ))}
          <Link href="/request" className="btn-primary ml-3">
            Request service
          </Link>
        </nav>
        <MobileMenu links={navLinks} />
      </div>
    </header>
  );
}
