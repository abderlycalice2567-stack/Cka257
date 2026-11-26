import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function Section({ children, className = "", labelledBy, tone = "white" }: { children: ReactNode; className?: string; labelledBy?: string; tone?: "white" | "cream" | "pine" }) {
  const tones = { white: "bg-white", cream: "bg-tan-light", pine: "bg-pine text-white" };
  return (
    <section aria-labelledby={labelledBy} className={`py-16 sm:py-20 ${tones[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

type ButtonProps = { href: string; variant?: "primary" | "secondary" | "light"; children: ReactNode; className?: string } & Omit<ComponentProps<typeof Link>, "href" | "className">;

const variants = {
  primary: "bg-pine text-white hover:bg-pine-dark",
  secondary: "border-2 border-pine text-pine bg-white hover:bg-tan-light",
  light: "bg-tan text-pine-ink hover:bg-white",
};

export const buttonClass = (variant: keyof typeof variants = "primary", extra = "") =>
  `inline-flex min-h-touch items-center justify-center gap-2 rounded-card px-6 py-3 font-heading text-base font-bold transition-colors ${variants[variant]} ${extra}`;

export function ButtonLink({ href, variant = "primary", children, className = "", ...rest }: ButtonProps) {
  return (
    <Link href={href} className={buttonClass(variant, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-pine">{children}</p>;
}

/** Marks content that is a proposal awaiting owner approval. Shown only in prototype mode. */
export function DraftNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-card border border-dashed border-pine/50 bg-tan-light px-4 py-3 text-sm text-muted">
      <span className="font-bold text-pine-ink">Draft for owner review: </span>
      {children}
    </p>
  );
}
