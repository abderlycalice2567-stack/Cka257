import Link from "next/link";
import { business } from "@/config/business";

/** Text wordmark placeholder — replace with the owner-supplied logo. */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-[44px] items-center gap-2.5 font-display text-lg font-extrabold tracking-tight ${inverse ? "text-white" : "text-navy"}`}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={inverse ? "#fff" : "#17324D"} />
        <path
          d="M10 22V10h7a4 4 0 0 1 0 8h-3.5V22z M13.5 13v2.2H17a1.1 1.1 0 0 0 0-2.2z"
          fill={inverse ? "#17324D" : "#fff"}
          fillRule="evenodd"
        />
        <circle cx="22.5" cy="21" r="2" fill="#087E83" />
      </svg>
      {business.name}
    </Link>
  );
}
