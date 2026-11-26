import { isPreview } from "@/config/business";

/** Shown on every page until the owner approves the site in writing. */
export function PreviewBanner() {
  if (!isPreview) return null;
  return (
    <aside aria-label="Preview notice" className="on-dark bg-navy-900 px-4 py-2 text-center text-sm text-white">
      <strong className="font-semibold">Private preview.</strong> Draft content awaiting owner approval — not an official or published website.
    </aside>
  );
}
