export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="border-b border-navy-100 bg-navy-50">
      <div className="container py-12 md:py-16">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">{title}</h1>
        {intro ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy-600">{intro}</p> : null}
      </div>
    </section>
  );
}
