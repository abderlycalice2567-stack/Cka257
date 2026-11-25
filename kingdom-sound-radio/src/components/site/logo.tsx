/* eslint-disable @next/next/no-img-element */

/** Station emblem (cross, crown of thorns, microphone, headphones) from the official logo. */
export function Emblem({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/emblem-128.webp"
      srcSet="/brand/emblem-128.webp 1x, /brand/emblem-256.webp 2x"
      width={size}
      height={size}
      alt=""
      className={`shrink-0 rounded-[22%] ring-1 ring-gold/30 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Emblem />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[15px] font-extrabold uppercase tracking-tight">The Kingdom Sound</span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.42em] text-accent">Radio</span>
        </span>
      )}
    </span>
  );
}

/** Full official logo (wordmark + tagline). Designed on navy, so use it on dark surfaces. */
export function FullLogo({ className = "", priority = false, style }: { className?: string; priority?: boolean; style?: React.CSSProperties }) {
  return (
    <img
      src="/brand/logo-full-1536.webp"
      srcSet="/brand/logo-full-768.webp 768w, /brand/logo-full-1536.webp 1536w"
      sizes="(min-width: 1024px) 560px, 92vw"
      width={1536}
      height={1024}
      alt="The Kingdom Sound Radio — Broadcasting Faith. Connecting Communities. Transforming Lives."
      className={className}
      style={style}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
