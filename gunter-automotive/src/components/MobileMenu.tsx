"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconClose, IconMenu } from "@/components/Icons";

export function MobileMenu({ items }: { items: readonly { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close when the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-lg text-brand"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <IconClose /> : <IconMenu />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      <nav
        id="mobile-nav"
        aria-label="Mobile"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-brand-100 bg-cream px-4 pb-4 shadow-card"
      >
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                className="flex min-h-touch items-center border-b border-brand-100 py-3 text-lg font-semibold text-brand aria-[current=page]:text-amber-800"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/request" className="btn-primary mt-4 w-full">
          Schedule a service request
        </Link>
      </nav>
    </div>
  );
}
