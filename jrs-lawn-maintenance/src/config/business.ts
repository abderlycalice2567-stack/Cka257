/**
 * Business configuration — the single source of truth for business facts.
 *
 * EVERYTHING here is UNVERIFIED prospect research unless marked `verified: true`.
 * The UI hides any field that is not verified (call buttons, hours, address,
 * structured data). Flip a flag only after the owner confirms the value in
 * writing — see docs/OWNER-DISCOVERY.md.
 */

export type Verifiable<T> = { value: T; verified: boolean };

export type ProjectPhoto = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

export type Review = { author: string; text: string; source: string; date: string };

export const business = {
  /** Display name as found in research. Legal/display name not yet confirmed. */
  name: "James Russell Smith Lawn Maintenance",
  shortName: "JRS Lawn Maintenance",
  nameVerified: false,

  /** From prospect research; not independently re-verified. Call UI hidden until verified. */
  phone: {
    value: { display: "706-227-1810", e164: "+17062271810" },
    verified: false,
  } satisfies Verifiable<{ display: string; e164: string }>,

  /** Public email for customers. None known. */
  email: { value: "", verified: false } satisfies Verifiable<string>,

  /** General location from research. Exact address is NOT published. */
  location: {
    value: { locality: "Athens", region: "GA", country: "US" },
    verified: false,
  } satisfies Verifiable<{ locality: string; region: string; country: string }>,

  /** Street address — only publish if the owner wants it shown. */
  streetAddress: { value: "", verified: false } satisfies Verifiable<string>,

  /** Service area wording, owner to supply (e.g. "Athens–Clarke County and nearby"). */
  serviceArea: { value: "", verified: false } satisfies Verifiable<string>,

  /** Weekly hours. Not verified for this package. */
  hours: {
    value: [] as { days: string; open: string; close: string }[],
    verified: false,
  },

  /** Owner-approved response-time wording shown after a request. Empty = generic text. */
  responseTime: { value: "", verified: false } satisfies Verifiable<string>,

  /** Owner-approved photos only. Empty array hides /projects and the homepage proof module. */
  projects: [] as ProjectPhoto[],

  /** Real, attributable reviews only — copied from a source the owner controls. Empty hides the module. */
  reviews: [] as Review[],

  /** Owner-approved story. Empty array shows a clearly-labelled placeholder in the demo. */
  aboutStory: [] as string[],

  /** Approved service slugs. Unapproved services are hidden at launch. */
  approvedServices: [] as string[],

  /** Domain is unknown; set NEXT_PUBLIC_SITE_URL. */
} as const;

export const isPhoneVerified = () => business.phone.verified;
export const isHoursVerified = () => business.hours.verified && business.hours.value.length > 0;

/**
 * Demo/prototype flag. While true, every page shows the "private prototype"
 * notice and unapproved services remain visible (labelled as proposals).
 * Set NEXT_PUBLIC_PROTOTYPE=false only at owner-approved launch.
 */
export const isPrototype = () => process.env.NEXT_PUBLIC_PROTOTYPE !== "false";
