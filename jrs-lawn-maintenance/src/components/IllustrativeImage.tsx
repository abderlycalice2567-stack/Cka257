import Image from "next/image";

/**
 * Placeholder artwork for the private demo. Always labelled "Illustrative"
 * so nobody mistakes it for photos of real work. Replace with owner-approved photos.
 */
export function IllustrativeImage({ src, alt, width, height, priority = false, className = "" }: { src: string; alt: string; width: number; height: number; priority?: boolean; className?: string }) {
  return (
    <figure className={`relative overflow-hidden rounded-card ${className}`}>
      <Image src={src} alt={alt} width={width} height={height} priority={priority} unoptimized className="h-auto w-full" />
      <figcaption className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-pine-ink">Illustrative image</figcaption>
    </figure>
  );
}
