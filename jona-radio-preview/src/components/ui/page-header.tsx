import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-navy-900 text-ivory">
      <div className="container-page py-14 sm:py-20">
        {eyebrow && <p className="eyebrow text-gold-400">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ivory/75">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
