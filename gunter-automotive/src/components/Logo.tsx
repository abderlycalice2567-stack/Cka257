import Link from "next/link";
import { business } from "@/config/business";

/** Placeholder wordmark for the private demo. Replace with the owner's approved logo. */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link href="/" className="inline-flex min-h-touch items-center gap-2" aria-label={`${business.name}, home`}>
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="12" fill={onDark ? "#FAF8F2" : "#19334D"} />
        <path d="M41 22a12 12 0 1 0 3 12h-11" fill="none" stroke="#D39B38" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`font-display text-lg font-extrabold leading-none tracking-tight ${onDark ? "text-cream" : "text-brand"}`}>
        Gunter<span className={onDark ? "text-amber" : "text-amber-800"}> Automotive</span>
      </span>
    </Link>
  );
}
