"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { primaryCta } from "@/config/business";
import { Logo } from "@/components/Logo";
import { navLinks } from "@/components/nav";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className="inline-flex min-h-[44px] items-center rounded-lg px-3 font-medium text-navy hover:bg-navy-50 aria-[current=page]:text-teal aria-[current=page]:underline aria-[current=page]:underline-offset-8"
            >
              {l.label}
            </Link>
          ))}
          <Link href={primaryCta.href} className="btn-primary ml-3">
            {primaryCta.label}
          </Link>
        </nav>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-navy hover:bg-navy-50 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      <nav id="mobile-menu" aria-label="Main" hidden={!open} className="border-t border-line bg-white md:hidden">
        <ul className="container-page py-2">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="flex min-h-[48px] items-center rounded-lg px-2 text-lg font-medium text-navy aria-[current=page]:text-teal"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="py-2">
            <Link href={primaryCta.href} className="btn-primary w-full">
              {primaryCta.label}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
