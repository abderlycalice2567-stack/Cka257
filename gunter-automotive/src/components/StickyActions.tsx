"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { business, hasPhone } from "@/config/business";
import { IconClipboard, IconPhone } from "@/components/Icons";

/** Mobile-only sticky bar. The call action is hidden until the phone number is verified. */
export function StickyActions() {
  const pathname = usePathname();
  // Redundant on the form itself and on the receipt page.
  if (pathname.startsWith("/request") || pathname.startsWith("/thank-you")) return null;
  const phone = hasPhone();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-cream/95 p-3 backdrop-blur md:hidden">
      <div className={`grid gap-3 ${phone ? "grid-cols-2" : "grid-cols-1"}`}>
        {phone && (
          <a href={`tel:${business.phone}`} className="btn-secondary px-3" data-track="phone-click">
            <IconPhone /> Call
          </a>
        )}
        <Link href="/request" className="btn-primary px-3">
          <IconClipboard /> Request service
        </Link>
      </div>
    </div>
  );
}
