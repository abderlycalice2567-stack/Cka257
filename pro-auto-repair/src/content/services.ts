import { business } from "@/config/business";

/**
 * Service copy. Everything here is a PROPOSAL for the owner to edit —
 * scope and exclusions are deliberately generic and make no promises
 * about price, turnaround, warranty or the makes/models serviced.
 */

export type Service = {
  slug: string;
  name: string;
  summary: string;
  problem: string;
  scope: string[];
  exclusions: string[];
  faqs: { id: string; question: string }[];
};

export const services: Service[] = [
  {
    slug: "diagnostics",
    name: "Diagnostics",
    summary: "A warning light, a new noise or something that just feels off — start by finding out why.",
    problem:
      "When a dashboard light comes on or the car starts behaving differently, it is hard to know how serious it is or what it will take to fix. A diagnostic visit is about getting a clear explanation before deciding anything.",
    scope: [
      "Discussion of the symptoms you have noticed and when they occur",
      "Inspection and testing relevant to the reported concern",
      "An explanation of what was found, in plain language",
      "Recommended next steps for you to approve or decline",
    ],
    exclusions: [
      "Repairs themselves — these are discussed and agreed separately",
      "A fixed price or diagnosis before the vehicle has been looked at",
    ],
    faqs: [
      { id: "diag-symptoms", question: "What should I tell you about the problem?" },
      { id: "diag-cost", question: "Is there a charge for diagnostics?" },
    ],
  },
  {
    slug: "general-repairs",
    name: "General repairs",
    summary: "Something needs fixing. Tell us what is happening and we will talk through the options.",
    problem:
      "A car that will not start, stop or drive the way it should disrupts everything. You want to know what is wrong, what the repair involves and what happens next — without surprises.",
    scope: [
      "Review of the concern and the vehicle's details",
      "A conversation about repair options before work begins",
      "Repair work that you have agreed to",
      "A summary of what was done",
    ],
    exclusions: [
      "Work that has not been discussed and approved by you",
      "Specialist work the shop does not offer — the owner will confirm the exact list",
    ],
    faqs: [
      { id: "repair-estimate", question: "How will I receive an estimate?" },
      { id: "repair-vehicles", question: "Which makes and models do you work on?" },
    ],
  },
  {
    slug: "preventive-maintenance",
    name: "Preventive maintenance",
    summary: "Routine care on a schedule that suits your vehicle, so small things stay small.",
    problem:
      "It is easy to lose track of what your vehicle is due for. Regular maintenance helps you plan ahead instead of reacting to a breakdown.",
    scope: [
      "Review of the vehicle's age, mileage and service history you can share",
      "Routine maintenance items agreed with you in advance",
      "Notes on anything worth keeping an eye on",
    ],
    exclusions: [
      "Repairs found during maintenance — these are raised with you first",
      "Any guarantee about future reliability",
    ],
    faqs: [
      { id: "maint-interval", question: "How often should my vehicle be serviced?" },
      { id: "maint-date", question: "Can I request a preferred appointment date?" },
    ],
  },
];

/** In preview every proposed service is shown; once the owner reviews the list only approved ones remain. */
export function visibleServices(): Service[] {
  const approved: readonly string[] | null = business.approvedServices;
  return approved === null ? services : services.filter((s) => approved.includes(s.slug));
}

export function getService(slug: string): Service | undefined {
  return visibleServices().find((s) => s.slug === slug);
}

export const process = [
  { title: "Tell us what you need", text: "Send a short request describing your vehicle and what is going on." },
  { title: "Discuss the details", text: "The shop gets in touch to ask questions and talk through options." },
  { title: "Agree on the next steps", text: "Nothing is scheduled or started until you have agreed to it." },
] as const;

export const homeFaqs = [
  { id: "home-info", question: "What information should I provide about my vehicle?" },
  { id: "home-date", question: "Can I request a preferred appointment date?" },
  { id: "home-estimate", question: "How will I receive an estimate?" },
] as const;
