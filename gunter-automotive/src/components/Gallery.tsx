import Image from "next/image";
import type { WorkshopPhoto } from "@/content/workshop";
import { Placeholder } from "@/components/Placeholder";

export function Gallery({ photos }: { photos: WorkshopPhoto[] }) {
  if (photos.length === 0) return null;
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {photos.map((p) => (
        <li key={p.caption}>
          {p.src && !p.illustrative ? (
            <figure>
              <Image src={p.src} alt={p.alt} width={800} height={600} className="aspect-[4/3] w-full rounded-card object-cover" />
              <figcaption className="mt-2 text-sm text-ink-muted">{p.caption}</figcaption>
            </figure>
          ) : (
            <div>
              <Placeholder label={p.caption.replace(/ \(.*\)$/, "").toLowerCase()} tone="cream" className="aspect-[4/3] w-full" />
              <p className="mt-2 text-sm text-ink-muted">{p.caption}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
