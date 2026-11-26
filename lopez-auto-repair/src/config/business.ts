/**
 * Single source of truth for business facts.
 *
 * RULE: nothing here is published as fact unless it is verified by the owner.
 * A `null` value means "not confirmed" — the UI hides that item (or, in the
 * private preview, shows a clearly labelled placeholder). Do not fill these
 * in from research or guesswork; get them from the owner in writing.
 */

export type DayHours = { day: string; open: string; close: string } | { day: string; closed: true };

export type Business = {
  /** Display name. Pending owner confirmation of legal/display name. */
  name: string;
  /** True only after the owner has approved identity, copy and contact data in writing. */
  ownerApproved: boolean;
  /** E.164 phone number, e.g. "+17705550100". null = unverified → call actions hidden. */
  phone: string | null;
  /** Public contact email. null = unverified → hidden. */
  email: string | null;
  address: {
    street: string | null;
    city: string;
    region: string;
    postalCode: string | null;
    /** False while the city itself is still unconfirmed. */
    confirmed: boolean;
  };
  /** Weekly hours. null = unverified → hidden. */
  hours: DayHours[] | null;
  /** Maps link for directions. null = unverified → hidden. */
  directionsUrl: string | null;
  /** Owner-approved "about" story paragraphs. null = placeholder in preview, section hidden in production. */
  story: string[] | null;
  /** Owner-approved expectation shown on the request page, e.g. response window. null = generic wording. */
  responseExpectation: string | null;
  /** Real, attributable customer reviews only. Empty = proof module hidden. */
  reviews: { quote: string; author: string; source: string }[];
};

export const business: Business = {
  name: "Lopez Auto Repair",
  ownerApproved: false,
  phone: null,
  email: null,
  address: {
    street: null,
    city: "Lawrenceville",
    region: "GA",
    postalCode: null,
    confirmed: false,
  },
  hours: null,
  directionsUrl: null,
  story: null,
  responseExpectation: null,
  reviews: [],
};

/** Preview = anything that has not been explicitly approved for the public. */
export const isPreview = !business.ownerApproved;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Indexing requires BOTH the env switch and owner approval. */
export const allowIndexing = process.env.ALLOW_INDEXING === "true" && business.ownerApproved;

export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export function locationLabel(): string {
  return `${business.address.city}, ${business.address.region}`;
}
