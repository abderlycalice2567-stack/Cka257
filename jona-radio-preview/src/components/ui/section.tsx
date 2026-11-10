import { ReactNode } from "react";

export function Section({
  children,
  className = "",
  id,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "muted" | "navy";
}) {
  const bg =
    tone === "navy" ? "bg-navy-900 text-ivory" : tone === "muted" ? "bg-white" : "";
  return (
    <section id={id} className={`py-16 sm:py-20 ${bg} ${className}`}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className={`mt-2 text-3xl font-bold sm:text-4xl ${light ? "text-ivory" : "text-navy-900"}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-base leading-relaxed ${light ? "text-ivory/70" : "text-slate"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "navy" | "muted";
}) {
  const styles =
    tone === "navy"
      ? "bg-navy-800 text-ivory"
      : tone === "muted"
        ? "bg-navy-50 text-navy-700"
        : "bg-gold-500/15 text-gold-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles}`}>
      {children}
    </span>
  );
}
