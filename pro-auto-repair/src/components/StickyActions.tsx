"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { business, primaryCta } from "@/config/business";

/** Mobile-only sticky action bar. The call button exists only when the phone number is verified. */
export function StickyActions() {
  const pathname = usePathname();
  if (pathname === "/request" || pathname === "/thank-you") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-line bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      {business.phone && (
        <a href={`tel:${business.phone}`} className="btn-secondary flex-1" data-track="phone-click">
          Call
        </a>
      )}
      <Link href={primaryCta.href} className="btn-primary flex-1">
        {primaryCta.label}
      </Link>
    </div>
  );
}
