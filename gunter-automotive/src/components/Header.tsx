import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { NavLinks } from "@/components/NavLinks";
import { navItems } from "@/lib/site";

export function Header() {
  const items = navItems();
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/85">
      <div className="container relative flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks items={items} />
        </nav>
        <Link href="/request" className="btn-primary hidden md:inline-flex">
          Schedule a service request
        </Link>
        <MobileMenu items={items} />
      </div>
    </header>
  );
}
