import { isLive } from "@/lib/site";

/**
 * Illustrative image placeholder (no stock photo, no fabricated imagery).
 * Clearly labelled so it can't be mistaken for a real photo of the shop.
 */
export function Placeholder({ label, className = "", tone = "brand" }: { label: string; className?: string; tone?: "brand" | "cream" }) {
  // Placeholders exist only in the private preview; live mode never shows them.
  if (isLive()) return null;
  const dark = tone === "brand";
  return (
    <figure
      role="img"
      aria-label={`Illustrative placeholder: ${label}`}
      className={`relative overflow-hidden rounded-card ${dark ? "bg-brand-700" : "bg-cream-200"} ${className}`}
    >
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id={`grid-${tone}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0v24" fill="none" stroke={dark ? "#ffffff" : "#19334D"} strokeOpacity="0.07" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#grid-${tone})`} />
        {/* Abstract vehicle silhouette */}
        <g fill="none" stroke="#D39B38" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          <path d="M70 190h260c8 0 14-6 14-14v-14c0-10-7-18-17-20l-38-6-30-30c-6-6-14-9-22-9h-74c-9 0-17 4-22 11l-21 28-30 6c-10 2-17 10-17 20v14c0 8 6 14 14 14z" />
          <circle cx="125" cy="192" r="24" fill={dark ? "#132839" : "#F1ECDF"} />
          <circle cx="285" cy="192" r="24" fill={dark ? "#132839" : "#F1ECDF"} />
          <path d="M150 104l-20 32h72v-32zM218 104v32h56l-24-26c-3-4-8-6-13-6z" opacity="0.6" />
        </g>
      </svg>
      <figcaption
        className={`absolute bottom-3 left-3 rounded-md px-2 py-1 text-xs font-semibold ${dark ? "bg-brand-800/90 text-cream" : "bg-white/90 text-brand"}`}
      >
        Illustrative placeholder · {label}
      </figcaption>
    </figure>
  );
}
