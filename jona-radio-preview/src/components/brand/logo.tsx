import Link from "next/link";

export function Logo({
  variant = "dark",
  className = "",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const text = variant === "light" ? "text-ivory" : "text-navy-900";
  const sub = variant === "light" ? "text-ivory/60" : "text-slate";
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Jona Radio — accueil">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-gold-500 shadow-card">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="2.4" fill="currentColor" />
          <path
            d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.8 4.8a10 10 0 0 0 0 14.4M19.2 4.8a10 10 0 0 1 0 14.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-none">
        <span className={`block font-display text-lg font-bold ${text}`}>Jona Radio</span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.2em] ${sub}`}>
          Foi · Espoir · Inspiration
        </span>
      </span>
    </Link>
  );
}
