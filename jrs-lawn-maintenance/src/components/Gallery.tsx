import Image from "next/image";
import type { ProjectPhoto } from "@/config/business";

/** Owner-approved project photos only. Renders nothing when empty (proof modules are hidden, never faked). */
export function Gallery({ photos, limit }: { photos: readonly ProjectPhoto[]; limit?: number }) {
  const shown = limit ? photos.slice(0, limit) : photos;
  if (shown.length === 0) return null;
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((p) => (
        <li key={p.src}>
          <figure className="overflow-hidden rounded-card border border-pine/15 bg-white">
            <Image src={p.src} alt={p.alt} width={p.width} height={p.height} sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw" className="h-auto w-full" />
            <figcaption className="p-4 text-sm text-muted">{p.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
