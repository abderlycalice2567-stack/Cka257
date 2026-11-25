export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="11" fill="#0B1120" />
        <path d="M11 27h18M13 23l3-9 4 5 4-5 3 9" stroke="#D4AF37" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="12" r="1.6" fill="#D4AF37" />
        <circle cx="20" cy="17" r="1.6" fill="#D4AF37" />
        <circle cx="24" cy="12" r="1.6" fill="#D4AF37" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[15px] font-bold tracking-tight">The Kingdom Sound</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Radio</span>
        </span>
      )}
    </span>
  );
}
