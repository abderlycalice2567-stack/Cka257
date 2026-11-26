import Link from "next/link";
import { business } from "@/config/business";

/** Text wordmark placeholder — swap for the owner's approved logo. */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link href="/" className="inline-flex min-h-[44px] items-center gap-2.5" aria-label={`${business.name} — home`}>
      <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-display text-lg font-extrabold text-white">
        L
      </span>
      <span className={`font-display text-lg font-extrabold leading-none tracking-tight ${onDark ? "text-white" : "text-navy-800"}`}>
        {business.name}
      </span>
    </Link>
  );
}
