/**
 * Service copy: PROPOSED, not verified. Every service has `approved: false`
 * until the owner signs off on scope. Unapproved services are still shown in
 * the private demo (labelled "draft") but are hidden when SITE_MODE=live.
 */

export type Service = {
  slug: "maintenance" | "diagnostics" | "repair";
  name: string;
  summary: string;
  problem: string;
  scope: string[];
  exclusions: string[];
  process: string[];
  faq: { q: string; a: string | null }[];
  approved: boolean;
};

export const services: Service[] = [
  {
    slug: "maintenance",
    name: "Maintenance",
    summary: "Routine care that helps keep your vehicle running the way it should.",
    problem:
      "Keeping track of routine upkeep is easy to put off. Tell us what your vehicle is due for, or what your manual recommends, and we'll talk through it with you.",
    scope: [
      "Scheduled maintenance items you or your owner's manual identify",
      "Fluid and filter checks",
      "Inspection of wear items, with findings explained before any work",
    ],
    exclusions: [
      "Specific maintenance items, brands and intervals are to be confirmed by the shop",
      "No work begins without your agreement on the next steps",
    ],
    process: ["Tell us what you need", "Discuss the details", "Agree on the next steps"],
    faq: [
      { q: "What information should I provide about my vehicle?", a: null },
      { q: "Can I request a preferred appointment date?", a: null },
    ],
    approved: false,
  },
  {
    slug: "diagnostics",
    name: "Diagnostics",
    summary: "Help working out what's behind a warning light, noise or change in how your vehicle drives.",
    problem:
      "A warning light or unfamiliar noise can be stressful. Describe what you're noticing, when it happens and anything that changed, so the conversation starts with the right details.",
    scope: [
      "Review of the symptoms you describe",
      "Diagnostic checks appropriate to the issue",
      "An explanation of findings and options before any repair",
    ],
    exclusions: [
      "Diagnostic equipment, fees and policies are to be confirmed by the shop",
      "A diagnosis is not a repair quote; estimates are discussed separately",
    ],
    process: ["Tell us what you need", "Discuss the details", "Agree on the next steps"],
    faq: [
      { q: "What information should I provide about my vehicle?", a: null },
      { q: "How will I receive an estimate?", a: null },
    ],
    approved: false,
  },
  {
    slug: "repair",
    name: "Repair",
    summary: "Repair work discussed with you up front, so you know the next steps.",
    problem:
      "When something needs fixing, you want to understand what's involved before you commit. Start a request and the shop will follow up to discuss it.",
    scope: [
      "Repairs identified through inspection or diagnostics",
      "A conversation about options before work starts",
      "Next steps agreed with you",
    ],
    exclusions: [
      "The types of repair offered are to be confirmed by the shop",
      "Pricing, parts and warranty terms are not stated here and must come from the shop",
    ],
    process: ["Tell us what you need", "Discuss the details", "Agree on the next steps"],
    faq: [
      { q: "How will I receive an estimate?", a: null },
      { q: "Can I request a preferred appointment date?", a: null },
    ],
    approved: false,
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
