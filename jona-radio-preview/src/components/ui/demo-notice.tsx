import { ReactNode } from "react";

/** Reusable inline notice to flag simulated features / demo-only behaviour. */
export function DemoNotice({ children, title = "Fonctionnalité de démonstration" }: { children: ReactNode; title?: string }) {
  return (
    <div className="rounded-2xl border border-gold-500/40 bg-gold-500/10 p-4 text-sm leading-relaxed text-navy-800">
      <p className="font-semibold text-gold-700">{title}</p>
      <div className="mt-1 text-navy-700">{children}</div>
    </div>
  );
}
