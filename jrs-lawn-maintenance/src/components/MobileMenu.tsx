"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NavLinks } from "./NavLinks";

export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
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
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-card border-2 border-pine px-3 font-heading font-bold text-pine"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div id="mobile-menu" hidden={!open} className="absolute inset-x-0 top-full z-40 border-b border-pine/15 bg-white shadow-lg">
        <nav aria-label="Mobile" className="px-4 pb-6 pt-2">
          <NavLinks
            items={[{ href: "/", label: "Home" }, ...items]}
            className="flex flex-col"
            linkClassName="flex min-h-touch items-center border-b border-pine/10 py-3 font-heading text-lg font-semibold text-pine-ink aria-[current=page]:text-pine aria-[current=page]:underline"
            onNavigate={() => setOpen(false)}
          />
          <Link href="/request" className="mt-4 flex min-h-touch items-center justify-center rounded-card bg-pine px-6 py-3 font-heading font-bold text-white" onClick={() => setOpen(false)}>
            Request lawn service
          </Link>
        </nav>
      </div>
    </div>
  );
}
