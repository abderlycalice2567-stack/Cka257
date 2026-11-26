"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items, className, linkClassName, onNavigate }: { items: { href: string; label: string }[]; className?: string; linkClassName?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link href={item.href} aria-current={active ? "page" : undefined} className={linkClassName} onClick={onNavigate}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
