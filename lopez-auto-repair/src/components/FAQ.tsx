import { isPreview } from "@/config/business";
import type { FaqItem } from "@/content/services";

/**
 * Native <details> accordion: keyboard accessible, works without JavaScript.
 * Questions without an owner-supplied answer show a labelled placeholder in
 * the private preview and are hidden entirely in an approved build.
 */
export function FAQ({ items }: { items: FaqItem[] }) {
  const visible = isPreview ? items : items.filter((i) => i.answer !== null);
  if (visible.length === 0) return null;
  return (
    <div className="divide-y divide-navy-100 rounded-card border border-navy-100 bg-white">
      {visible.map((item) => (
        <details key={item.question} className="group px-5">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-lg font-bold text-navy-800 [&::-webkit-details-marker]:hidden">
            {item.question}
            <svg aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-45" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B83A32" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </summary>
          <div className="pb-5 leading-relaxed text-navy-600">
            {item.answer ?? <p className="draft-note">Answer to be supplied by the owner. This question is hidden on the public site until then.</p>}
          </div>
        </details>
      ))}
    </div>
  );
}
