import Image from "next/image";
import type { GalleryItem } from "@/config/business";
import { Illustration } from "@/components/Illustration";

export function GalleryFigure({ item, priority = false }: { item: GalleryItem; priority?: boolean }) {
  return (
    <figure className="overflow-hidden rounded-card border border-line bg-white">
      <div className="relative aspect-[4/3]">
        {item.src ? (
          <Image src={item.src} alt={item.alt} fill priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <div role="img" aria-label={item.alt} className="h-full w-full">
            <Illustration scene={item.scene} className="h-full w-full" />
          </div>
        )}
        {item.illustrative && (
          <span className="absolute left-3 top-3 rounded-md bg-navy-900 px-2 py-1 text-xs font-semibold text-white">
            Illustrative
          </span>
        )}
      </div>
      <figcaption className="px-4 py-3 text-sm text-muted">{item.caption}</figcaption>
    </figure>
  );
}

export function Gallery({ items }: { items: readonly GalleryItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <GalleryFigure item={item} />
        </li>
      ))}
    </ul>
  );
}
