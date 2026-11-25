/* eslint-disable @next/next/no-img-element */
// Generated artwork: deterministic gradients from a slug, used whenever no
// uploaded cover/photo exists. Avoids stock photography and invented faces.

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const PALETTES: [string, string, string][] = [
  ["#0B1120", "#2A3459", "#D4AF37"],
  ["#131A31", "#56618A", "#E0C25A"],
  ["#1A2340", "#8F7420", "#F5E9BF"],
  ["#0F1528", "#1A2340", "#D4AF37"],
  ["#2A3459", "#0B1120", "#EBD585"],
  ["#0B1120", "#6B5718", "#F8F7F4"],
];

export function ProgramArt({
  seed,
  label,
  src,
  className = "",
  rounded = "rounded-2xl",
}: {
  seed: string;
  label?: string;
  src?: string | null;
  className?: string;
  rounded?: string;
}) {
  if (src) {
    return <img src={src} alt="" className={`${rounded} object-cover ${className}`} loading="lazy" />;
  }
  const h = hash(seed);
  const [a, b, c] = PALETTES[h % PALETTES.length]!;
  const rot = h % 360;
  const bars = Array.from({ length: 18 }, (_, i) => 18 + ((h >>> (i % 24)) % 60));
  const initials = (label || seed)
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ background: `linear-gradient(${rot}deg, ${a}, ${b})` }}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <circle cx={40 + (h % 120)} cy={30 + ((h >>> 3) % 80)} r={70} fill={c} opacity="0.12" />
        <g transform="translate(14 150)">
          {bars.map((v, i) => (
            <rect key={i} x={i * 10} y={-v} width="5" height={v} rx="2.5" fill={c} opacity={0.25 + (i % 3) * 0.12} />
          ))}
        </g>
      </svg>
      <span className="absolute left-3 top-3 font-display text-lg font-bold text-ivory/90">{initials}</span>
    </div>
  );
}

export function Avatar({ name, src, size = 56 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  if (src) {
    return <img src={src} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const h = hash(name);
  const [a, b] = PALETTES[h % PALETTES.length]!;
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-gold"
      style={{ width: size, height: size, fontSize: size / 2.8, background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initials}
    </span>
  );
}
