"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as I from "@/components/icons";
import { localeNames, locales, type Locale } from "@/lib/i18n/config";

export function ThemeToggle({ labels }: { labels: { theme: string; light: string; dark: string } }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    // Read the class set by the pre-paint theme script (only available after hydration).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("ksr_theme", next ? "dark" : "light");
    } catch {
      /* non-essential */
    }
    setDark(next);
  };
  return (
    <button type="button" onClick={toggle} className="btn-ghost h-10 w-10 !p-0" aria-label={`${labels.theme}: ${dark ? labels.dark : labels.light}`} title={labels.theme}>
      {dark ? <I.Sun /> : <I.Moon />}
    </button>
  );
}

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || `/${locale}`;
  const [open, setOpen] = useState(false);
  const target = (l: Locale) => {
    const parts = pathname.split("/");
    parts[1] = l;
    return parts.join("/") || `/${l}`;
  };
  return (
    <div className="relative">
      <button type="button" className="btn-ghost h-10 gap-1 !px-2.5" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={label}>
        <I.Globe size={18} />
        <span className="text-xs font-semibold uppercase">{locale}</span>
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-line bg-surface p-1 shadow-lift">
          {locales.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <a
                href={target(l)}
                hrefLang={l}
                lang={l}
                onClick={() => {
                  document.cookie = `ksr_locale=${l}; path=/; max-age=31536000; samesite=lax`;
                }}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-surface-2 ${l === locale ? "font-semibold" : ""}`}
              >
                {localeNames[l]}
                {l === locale && <I.Check size={16} />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MobileMenu({
  items,
  labels,
}: {
  items: { href: string; label: string }[];
  labels: { menu: string; close: string };
}) {
  const pathname = usePathname();
  // The menu is "open at" the path where it was opened, so navigating closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt !== null && openAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button type="button" className="btn-ghost h-10 w-10 !p-0 lg:hidden" onClick={() => setOpen(true)} aria-label={labels.menu} aria-expanded={open}>
        <I.Menu />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <nav
            className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-bg p-5 shadow-lift"
            onClick={(e) => e.stopPropagation()}
            aria-label={labels.menu}
          >
            <div className="mb-4 flex justify-end">
              <button type="button" className="btn-ghost h-10 w-10 !p-0" onClick={() => setOpen(false)} aria-label={labels.close}>
                <I.Close />
              </button>
            </div>
            <ul className="space-y-1">
              {items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className={`block rounded-xl px-3 py-2.5 text-base font-medium hover:bg-surface-2 ${pathname === it.href ? "bg-surface-2 text-accent" : ""}`}>
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

export function NavLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname() || "";
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-accent ${active ? "text-accent" : "text-fg/80"}`}>
      {children}
    </Link>
  );
}

export function BottomNav({ items }: { items: { href: string; label: string; icon: "home" | "live" | "schedule" | "replay" | "profile"; exact?: boolean }[] }) {
  const pathname = usePathname() || "";
  const icons = { home: I.Home, live: I.Radio, schedule: I.Calendar, replay: I.Replay, profile: I.User };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Primary">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const Icon = icons[it.icon];
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={active ? "page" : undefined} className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}>
                <Icon size={22} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
