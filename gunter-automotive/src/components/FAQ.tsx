import { isLive } from "@/lib/site";

/** Native <details> accordion: keyboard accessible with no JavaScript. */
export function FAQ({ items, title = "Frequently asked questions" }: { items: { q: string; a: string | null }[]; title?: string }) {
  const visible = isLive() ? items.filter((i) => i.a) : items;
  if (visible.length === 0) return null;
  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-2xl font-bold sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 divide-y divide-brand-100 rounded-card border border-brand-100 bg-white">
        {visible.map((item) => (
          <details key={item.q} className="group px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-brand">
              {item.q}
              <span aria-hidden className="text-xl text-amber-800 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            {item.a ? (
              <p className="pb-4 text-ink-muted">{item.a}</p>
            ) : (
              <p className="draft-note mb-4">Answer to be supplied by the owner. Prices and policies are deliberately not stated here.</p>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
