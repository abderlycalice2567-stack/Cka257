/**
 * Business configuration: the ONLY place business facts live.
 *
 * Every value below is either a proposal from the sales handoff or `null`
 * because it has NOT been verified with the owner. Components must hide
 * anything that is `null` rather than invent a stand-in. See
 * docs/OWNER-DISCOVERY.md for the list of launch blockers.
 */

export type WeeklyHours = { day: string; open: string | null; close: string | null }[];

export type Business = {
  /** Display name used in the header and titles (legal name still to be confirmed). */
  name: string;
  legalName: string | null;
  tagline: string;
  /** E.164 phone, e.g. "+14045550100". `null` hides every call action. */
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  address: {
    street: string | null;
    city: string | null;
    region: string; // state
    postalCode: string | null;
  };
  serviceArea: string | null;
  hours: WeeklyHours | null;
  holidayHoursNote: string | null;
  /** Owner-approved expectation shown after a request, e.g. "within one business day". */
  responseTime: string | null;
  /** Owner-approved story. `null` shows a clearly-marked draft placeholder. */
  story: string | null;
  /** Approved schema type: only emit structured data once identity is verified. */
  schemaVerified: boolean;
};

export const business: Business = {
  name: "Gunter Automotive",
  legalName: null,
  tagline: "Auto care in Georgia",
  phone: null,
  phoneDisplay: null,
  email: null,
  address: { street: null, city: null, region: "GA", postalCode: null },
  serviceArea: null,
  hours: null,
  holidayHoursNote: null,
  responseTime: null,
  story: null,
  schemaVerified: false,
};

export const hasPhone = (): boolean => Boolean(business.phone && business.phoneDisplay);

export function locationLabel(): string {
  const { city, region } = business.address;
  return city ? `${city}, ${region}` : "Georgia";
}
