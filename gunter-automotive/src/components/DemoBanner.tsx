import { isLive } from "@/lib/site";

/** Persistent banner so nobody mistakes the sales prototype for the real site. */
export function DemoBanner() {
  if (isLive()) return null;
  return (
    <div className="bg-brand-800 px-4 py-2 text-center text-xs text-cream sm:text-sm" role="note">
      <strong className="font-semibold text-amber-300">Private preview.</strong> Sales prototype with draft copy and illustrative placeholders. Not
      approved by the business, and not a live booking site.
    </div>
  );
}
