import { isPreview } from "@/config/business";
import { gallery } from "@/content/services";
import { Illustration } from "./Illustration";

export function Gallery({ limit }: { limit?: number }) {
  const items = limit ? gallery.slice(0, limit) : gallery;
  if (items.length === 0) return null;
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.art}>
          <Illustration art={item.art} alt={item.alt} />
          <p className="mt-3 text-[15px] text-navy-600">
            <span className="font-semibold text-navy-800">{item.caption}.</span>{" "}
            {isPreview ? "Illustrative only — to be replaced with an owner-approved photo." : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
