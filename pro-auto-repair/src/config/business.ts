/**
 * Single source of truth for business facts.
 *
 * RULE: a value is `null` until the owner has confirmed it in writing.
 * Components hide anything that is null — they never fall back to a guess.
 * See docs/OWNER_DISCOVERY.md for the list of launch blockers.
 */

export type DayHours = { day: string; open: string; close: string } | { day: string; closed: true };

export type GalleryItem = {
  id: string;
  caption: string;
  alt: string;
  /** true = illustrative placeholder, not a photo of the business. */
  illustrative: boolean;
  /** Path under /public for an owner-approved photo. Null renders a labeled placeholder. */
  src: string | null;
  scene: "bay" | "inspection" | "desk";
};

export type Review = { author: string; text: string; source: string; date: string };

export const business = {
  /** Display name — to be confirmed against the legal/display name. */
  name: "Pro Auto Repair",
  /** Proposed, unverified. */
  region: "Georgia",
  city: null as string | null,
  phone: null as string | null, // E.164, e.g. "+14045550100" — only once verified
  phoneDisplay: null as string | null,
  email: null as string | null,
  address: null as
    | null
    | { street: string; city: string; region: string; postalCode: string; country: string },
  directionsUrl: null as string | null,
  serviceArea: null as string | null,
  hours: null as DayHours[] | null,
  /** Owner-approved expectation, e.g. "We reply within one business day." */
  responseExpectation: null as string | null,
  /** Owner-approved story paragraphs for /about. */
  story: null as string[] | null,
  team: [] as { name: string; role: string }[],
  credentials: [] as string[],
  /** Real, attributable reviews only. Empty = the module is not rendered. */
  reviews: [] as Review[],
  /** FAQ answers supplied by the owner, keyed by question id. */
  faqAnswers: {} as Record<string, string>,
  /** Service slugs the owner has approved for launch. Null = not yet reviewed. */
  approvedServices: null as string[] | null,
  /** True only when name, address, phone and hours are all confirmed. Enables JSON-LD. */
  identityVerified: false,
  gallery: [
    {
      id: "bay",
      caption: "Repair bay — illustrative placeholder",
      alt: "Illustration of a vehicle on a lift in a repair bay (placeholder, not the business)",
      illustrative: true,
      src: null,
      scene: "bay",
    },
    {
      id: "inspection",
      caption: "Vehicle inspection — illustrative placeholder",
      alt: "Illustration of a vehicle inspection checklist (placeholder, not the business)",
      illustrative: true,
      src: null,
      scene: "inspection",
    },
    {
      id: "desk",
      caption: "Service desk — illustrative placeholder",
      alt: "Illustration of a service desk (placeholder, not the business)",
      illustrative: true,
      src: null,
      scene: "desk",
    },
  ] as GalleryItem[],
};

export const primaryCta = { label: "Request repair service", href: "/request" } as const;
