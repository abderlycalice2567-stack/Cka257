"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { business, isPhoneVerified } from "@/config/business";

/** Mobile-only bottom bar. The call action appears only once the phone number is verified. */
export function StickyActions() {
  const pathname = usePathname();
  const showCall = isPhoneVerified();
  // Redundant on the request flow itself.
  if (pathname === "/request" || pathname === "/thank-you") return null;
  return (
    <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-30 border-t border-pine/15 bg-white/95 p-3 backdrop-blur sm:hidden print:hidden">
      <div className={`grid gap-3 ${showCall ? "grid-cols-2" : "grid-cols-1"}`}>
        {showCall && (
          <a href={`tel:${business.phone.value.e164}`} data-track="phone-click" className="flex min-h-touch items-center justify-center rounded-card border-2 border-pine font-heading font-bold text-pine">
            Call
          </a>
        )}
        <Link href="/request" className="flex min-h-touch items-center justify-center rounded-card bg-pine font-heading font-bold text-white">
          Request lawn service
        </Link>
      </div>
    </nav>
  );
}
