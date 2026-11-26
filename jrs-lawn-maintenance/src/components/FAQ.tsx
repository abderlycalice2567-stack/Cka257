/** Native <details> disclosure — keyboard and screen-reader accessible without JS. */
export function FAQ({ items, headingId = "faq-title", title = "Frequently asked questions" }: { items: { q: string; a: string }[]; headingId?: string; title?: string }) {
  return (
    <div>
      <h2 id={headingId} className="font-heading text-3xl font-extrabold text-pine-ink">
        {title}
      </h2>
      <div className="mt-8 divide-y divide-pine/15 rounded-card border border-pine/15 bg-white">
        {items.map((item) => (
          <details key={item.q} className="group px-6">
            <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 py-4 font-heading text-lg font-semibold text-pine-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <span aria-hidden="true" className="text-2xl text-pine transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
