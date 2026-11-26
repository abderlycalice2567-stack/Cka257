import { isPrototype } from "@/config/business";

export function PrototypeBanner() {
  if (!isPrototype()) return null;
  return (
    <aside aria-label="Prototype notice" className="bg-pine-ink px-4 py-2 text-center text-sm text-white">
      <strong>Private prototype.</strong> Not an official website. Business details, services and copy are proposals awaiting the owner&apos;s approval.
    </aside>
  );
}
