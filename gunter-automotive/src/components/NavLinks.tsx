"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={pathname.startsWith(item.href) ? "page" : undefined}
            className="inline-flex min-h-touch items-center rounded-lg px-3 font-semibold text-brand hover:bg-brand-50 aria-[current=page]:text-amber-800 aria-[current=page]:underline aria-[current=page]:underline-offset-8"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
