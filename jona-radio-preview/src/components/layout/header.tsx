"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ListenButton } from "@/components/player/listen-button";
import { MenuIcon, CloseIcon, ArrowIcon } from "@/components/icons";
import { primaryNav } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent background scroll when the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = primaryNav.filter((n) => !n.cta);
  const donate = primaryNav.find((n) => n.cta);

  return (
    <header className="sticky top-0 z-30 border-b border-navy-100 bg-ivory/90 backdrop-blur supports-[backdrop-filter]:bg-ivory/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                  active ? "bg-navy-800 text-ivory" : "text-navy-700 hover:bg-navy-50 hover:text-navy-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {donate && (
            <Link href={donate.href} className="btn-outline px-4 py-2 text-sm">
              {donate.label}
            </Link>
          )}
          <ListenButton size="md" />
        </div>

        <button
          type="button"
          className="rounded-full p-2 text-navy-800 hover:bg-navy-50 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <MenuIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="fixed inset-0 top-0 z-50 flex flex-col bg-navy-900 text-ivory lg:hidden">
          <div className="container-page flex h-16 items-center justify-between">
            <Logo variant="light" />
            <button
              type="button"
              className="rounded-full p-2 hover:bg-white/10"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Navigation mobile" className="container-page flex flex-1 flex-col gap-1 overflow-y-auto py-4">
            {primaryNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-medium ${
                    active ? "bg-white/10 text-gold-400" : "hover:bg-white/5"
                  }`}
                >
                  <span>
                    {item.label}
                    {item.demo && <span className="ml-2 text-[10px] uppercase text-gold-400">démo</span>}
                  </span>
                  <ArrowIcon width={18} height={18} className="opacity-50" />
                </Link>
              );
            })}
            <div className="mt-4 px-1">
              <ListenButton size="lg" className="w-full" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
