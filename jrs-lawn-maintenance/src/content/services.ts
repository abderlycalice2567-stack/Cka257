/**
 * Service copy — PROPOSED, pending owner approval. No prices, guarantees or
 * policies are stated; the owner supplies those. Each service follows the
 * handoff template: problem, proposed scope, exclusions, process, FAQ, CTA.
 */
import { business, isPrototype } from "@/config/business";

export type Service = {
  slug: string;
  name: string;
  shortName: string;
  summary: string;
  image: { src: string; alt: string };
  problem: string;
  scope: string[];
  exclusions: string[];
  process: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  metaDescription: string;
};

const OWNER_TBD = "The owner will confirm the answer to this question before launch.";

export const services: Service[] = [
  {
    slug: "mowing",
    name: "Lawn Mowing",
    shortName: "Mowing",
    summary: "Regular mowing to keep your grass at a tidy, even height through the growing season.",
    image: { src: "/images/mowing.svg", alt: "Illustration of freshly mowed lawn stripes in front of a house" },
    problem:
      "Grass grows fast in Georgia's warm months. Falling behind on mowing leaves a yard looking overgrown and makes the next cut harder on the lawn.",
    scope: [
      "Mowing of accessible turf areas",
      "Trimming around obstacles such as trees, beds and fences (to be confirmed)",
      "Blowing clippings off hard surfaces like driveways and walkways (to be confirmed)",
    ],
    exclusions: [
      "Landscape design or installation",
      "Tree work",
      "Anything not agreed with the owner before the visit",
    ],
    process: [
      { title: "Tell us about your yard", body: "Share your ZIP code, rough yard size and how often you'd like mowing." },
      { title: "Discuss the details", body: "The owner follows up to talk through access, timing and any special requests." },
      { title: "Agree on next steps", body: "You decide together whether and when service starts. Nothing is booked automatically." },
    ],
    faq: [
      { q: "Can I request recurring mowing?", a: "Yes — choose a frequency on the request form. The owner will confirm what's available." },
      { q: "How much does mowing cost?", a: OWNER_TBD },
      { q: "Do I need to be home?", a: OWNER_TBD },
    ],
    metaDescription: "Request lawn mowing in the Athens, GA area. Tell us about your yard and how often you'd like service.",
  },
  {
    slug: "edging",
    name: "Edging",
    shortName: "Edging",
    summary: "Clean, defined edges along driveways, sidewalks and beds for a finished look.",
    image: { src: "/images/edging.svg", alt: "Illustration of a crisp lawn edge beside a concrete walkway" },
    problem:
      "Grass creeping over sidewalks and into beds makes even a freshly mowed lawn look unfinished.",
    scope: [
      "Edging along driveways, sidewalks and curbs",
      "Bed-line edging where requested (to be confirmed)",
      "Cleanup of edging debris from hard surfaces",
    ],
    exclusions: ["Hardscape or bed installation", "Mulch or plant installation unless the owner offers it"],
    process: [
      { title: "Tell us what needs edging", body: "Describe the areas — driveway, walks, beds — in the request form." },
      { title: "Discuss the details", body: "The owner follows up to confirm what's included." },
      { title: "Agree on next steps", body: "Edging can be a one-time visit or part of routine maintenance, if offered." },
    ],
    faq: [
      { q: "Can edging be added to regular mowing?", a: OWNER_TBD },
      { q: "How much does edging cost?", a: OWNER_TBD },
    ],
    metaDescription: "Request lawn edging along driveways, sidewalks and beds in the Athens, GA area.",
  },
  {
    slug: "routine-lawn-maintenance",
    name: "Routine Lawn Maintenance",
    shortName: "Routine maintenance",
    summary: "A dependable, recurring visit that keeps your yard looking cared for without you thinking about it.",
    image: { src: "/images/maintenance.svg", alt: "Illustration of a tidy front yard with a mower and trimmed hedges" },
    problem:
      "Between work and family, regular yard upkeep is easy to put off. A recurring schedule takes it off your list.",
    scope: [
      "Recurring visits at an agreed frequency",
      "Mowing and edging (as agreed)",
      "General tidy-up of clippings and debris from hard surfaces",
      "Additional tasks only if the owner offers them",
    ],
    exclusions: ["Elaborate landscaping projects", "Irrigation repair", "Chemical treatments unless offered and licensed"],
    process: [
      { title: "Tell us what you need", body: "Choose a frequency and describe your yard in the request form." },
      { title: "Discuss the details", body: "The owner follows up to agree what each visit covers." },
      { title: "Agree on next steps", body: "Start whenever you're both ready. You can adjust the plan by talking with the owner." },
    ],
    faq: [
      { q: "How often can visits be scheduled?", a: OWNER_TBD },
      { q: "Can I pause service?", a: OWNER_TBD },
      { q: "What happens if it rains?", a: OWNER_TBD },
    ],
    metaDescription: "Request recurring lawn maintenance in the Athens, GA area — mowing, edging and general upkeep on a schedule.",
  },
];

/** Services visible on the site: all (labelled as proposals) in prototype mode, approved ones at launch. */
export function visibleServices(): Service[] {
  if (isPrototype()) return services;
  return services.filter((s) => (business.approvedServices as readonly string[]).includes(s.slug));
}

export function getService(slug: string): Service | undefined {
  return visibleServices().find((s) => s.slug === slug);
}

/** Homepage FAQ — questions from the handoff; answers come from the owner. */
export const homeFaq = [
  { q: "What areas do you serve?", a: business.serviceArea.verified ? business.serviceArea.value : OWNER_TBD },
  { q: "Can I request recurring service?", a: "Yes. Pick a frequency on the request form and the owner will follow up to discuss it." },
  {
    q: "What information is needed for an estimate?",
    a: "Your name, a phone number or email, the service you're interested in and a short description of your yard. ZIP code and yard size help too.",
  },
];
