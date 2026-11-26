export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="border-b border-brand-100 bg-cream-200/60">
      <div className="container py-12 md:py-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl md:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-ink-muted">{intro}</p>}
      </div>
    </section>
  );
}
