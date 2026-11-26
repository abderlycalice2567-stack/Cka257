"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Mobile-only sticky action bar. The call button renders only when a verified
 * phone number exists in the business config.
 */
export function StickyActions({ phone }: { phone: string | null }) {
  const pathname = usePathname();
  if (pathname === "/request" || pathname === "/thank-you") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-100 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}>
      <div className="flex gap-3">
        {phone ? (
          <a href={`tel:${phone}`} className="btn-secondary flex-1" data-track="phone-click">
            Call
          </a>
        ) : null}
        <Link href="/request" className="btn-primary flex-1">
          Request service
        </Link>
      </div>
    </div>
  );
}
