/**
 * Illustrative placeholder artwork (original inline SVG — no stock photos,
 * no real people or premises). Replace with owner-approved photography
 * before any public launch.
 */
import { isPreview } from "@/config/business";

export type Art = "bay" | "inspect" | "reception";

const NAVY = "#14283F";
const RED = "#B83A32";

function Car({ x, y, hoodOpen = false, color = RED }: { x: number; y: number; hoodOpen?: boolean; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M8 62 Q8 46 30 43 L62 20 Q68 15 78 15 L132 15 Q142 15 149 22 L170 43 L196 47 Q208 49 208 60 L208 66 L8 66 Z" fill={color} />
      <path d="M70 23 L102 23 L102 42 L46 42 Z" fill="#E4EAF1" />
      <path d="M110 23 L134 23 Q139 23 143 27 L157 42 L110 42 Z" fill="#E4EAF1" />
      {hoodOpen ? <path d="M170 43 L206 6 L212 10 L200 48 Z" fill={color} stroke={NAVY} strokeWidth="1.5" /> : null}
      <rect x="4" y="58" width="12" height="6" rx="2" fill={NAVY} />
      <rect x="200" y="56" width="12" height="6" rx="2" fill={NAVY} />
      <circle cx="54" cy="66" r="17" fill={NAVY} />
      <circle cx="54" cy="66" r="8" fill="#C5D1DF" />
      <circle cx="164" cy="66" r="17" fill={NAVY} />
      <circle cx="164" cy="66" r="8" fill="#C5D1DF" />
    </g>
  );
}

function Scene({ art }: { art: Art }) {
  if (art === "bay") {
    return (
      <>
        <rect width="400" height="300" fill="#E4EAF1" />
        <rect y="232" width="400" height="68" fill="#C5D1DF" />
        {/* roll-up door */}
        <rect x="40" y="36" width="320" height="196" rx="4" fill="#F3F6F9" stroke="#93A6BC" strokeWidth="2" />
        {[68, 100, 132, 164, 196].map((y) => (
          <line key={y} x1="40" x2="360" y1={y} y2={y} stroke="#C5D1DF" strokeWidth="2" />
        ))}
        {/* lift */}
        <rect x="78" y="70" width="14" height="170" rx="3" fill={NAVY} />
        <rect x="308" y="70" width="14" height="170" rx="3" fill={NAVY} />
        <rect x="68" y="236" width="34" height="8" rx="2" fill={NAVY} />
        <rect x="298" y="236" width="34" height="8" rx="2" fill={NAVY} />
        <rect x="92" y="176" width="216" height="8" rx="2" fill="#4A6078" />
        <Car x={92} y={96} />
        {/* tool chest */}
        <rect x="336" y="196" width="48" height="46" rx="4" fill={RED} />
        <rect x="342" y="204" width="36" height="6" rx="2" fill="#FFFFFF" opacity=".85" />
        <rect x="342" y="216" width="36" height="6" rx="2" fill="#FFFFFF" opacity=".85" />
        <rect x="342" y="228" width="36" height="6" rx="2" fill="#FFFFFF" opacity=".85" />
      </>
    );
  }
  if (art === "inspect") {
    return (
      <>
        <rect width="400" height="300" fill="#F3F6F9" />
        <rect y="226" width="400" height="74" fill="#C5D1DF" />
        {/* pegboard */}
        <rect x="24" y="30" width="150" height="84" rx="6" fill="#FFFFFF" stroke="#C5D1DF" strokeWidth="2" />
        <path d="M48 50 v36 M44 50 h8 M74 48 l0 40 M70 84 h8 M100 50 v30 a6 6 0 0 0 12 0 v-30 M136 50 v40 M130 50 h12" stroke={NAVY} strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* pendant light */}
        <line x1="300" x2="300" y1="0" y2="40" stroke="#93A6BC" strokeWidth="2" />
        <path d="M276 58 Q300 26 324 58 Z" fill={NAVY} />
        <path d="M280 58 L250 150 L350 150 L320 58 Z" fill="#FFFFFF" opacity=".55" />
        <Car x={28} y={148} hoodOpen />
        {/* mechanic */}
        <circle cx="290" cy="128" r="14" fill="#93A6BC" />
        <path d="M290 122 a14 14 0 0 1 14 6 l-28 0 a14 14 0 0 1 14 -6 Z" fill={NAVY} />
        <path d="M276 146 Q290 138 306 146 L312 200 L302 200 L300 236 L288 236 L288 204 L284 236 L272 236 L272 200 Z" fill={NAVY} />
        <path d="M278 152 L246 174" stroke={NAVY} strokeWidth="9" strokeLinecap="round" />
        <circle cx="244" cy="175" r="5" fill="#93A6BC" />
        <rect x="268" y="234" width="18" height="7" rx="3" fill="#33485F" />
        <rect x="286" y="234" width="18" height="7" rx="3" fill="#33485F" />
      </>
    );
  }
  return (
    <>
      <rect width="400" height="300" fill="#F3F6F9" />
      <rect y="232" width="400" height="68" fill="#C5D1DF" />
      {/* window */}
      <rect x="30" y="38" width="130" height="96" rx="6" fill="#FFFFFF" stroke="#93A6BC" strokeWidth="2" />
      <line x1="95" x2="95" y1="38" y2="134" stroke="#93A6BC" strokeWidth="2" />
      <line x1="30" x2="160" y1="86" y2="86" stroke="#93A6BC" strokeWidth="2" />
      {/* clock */}
      <circle cx="318" cy="66" r="24" fill="#FFFFFF" stroke={NAVY} strokeWidth="4" />
      <path d="M318 66 V50 M318 66 L330 72" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
      {/* counter */}
      <rect x="170" y="148" width="210" height="10" rx="3" fill={NAVY} />
      <rect x="180" y="158" width="190" height="82" fill={RED} />
      <rect x="196" y="174" width="158" height="50" rx="4" fill="#9A2E27" />
      {/* monitor */}
      <rect x="300" y="108" width="56" height="34" rx="4" fill={NAVY} />
      <rect x="324" y="142" width="8" height="6" fill={NAVY} />
      {/* bell */}
      <path d="M214 148 a14 14 0 0 1 28 0 Z" fill="#93A6BC" />
      <circle cx="228" cy="132" r="3" fill={NAVY} />
      {/* chairs */}
      {[40, 100].map((x) => (
        <g key={x}>
          <rect x={x} y="170" width="44" height="40" rx="6" fill={NAVY} />
          <rect x={x - 4} y="206" width="52" height="12" rx="5" fill="#33485F" />
          <rect x={x} y="218" width="5" height="22" fill="#33485F" />
          <rect x={x + 39} y="218" width="5" height="22" fill="#33485F" />
        </g>
      ))}
    </>
  );
}

export function Illustration({ art, alt, className = "", priority = false }: { art: Art; alt: string; className?: string; priority?: boolean }) {
  return (
    <figure className={`relative overflow-hidden rounded-card border border-navy-100 bg-navy-50 ${className}`}>
      <svg viewBox="0 0 400 300" role="img" aria-label={alt} className="block h-auto w-full" preserveAspectRatio="xMidYMid slice" data-priority={priority || undefined}>
        <Scene art={art} />
      </svg>
      {isPreview ? (
        <figcaption className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-navy-700">
          Illustrative placeholder
        </figcaption>
      ) : null}
    </figure>
  );
}
