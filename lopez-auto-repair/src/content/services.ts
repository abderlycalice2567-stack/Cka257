/**
 * Service copy. Everything here is PROPOSED draft copy for the private
 * preview, not a verified description of what the shop offers. Set
 * `approved: true` only after the owner signs off on a service; in an
 * owner-approved (public) build, unapproved services are hidden.
 *
 * Do not add prices, turnaround times, warranties or guarantees unless the
 * owner supplies them.
 */
import { business } from "@/config/business";

export type FaqItem = { question: string; /** null = owner has not supplied an answer yet */ answer: string | null };

export type Service = {
  slug: "general-repair" | "diagnostics" | "maintenance";
  name: string;
  approved: boolean;
  summary: string;
  metaDescription: string;
  problem: { heading: string; body: string };
  scope: string[];
  exclusions: string[];
  faq: FaqItem[];
  art: "bay" | "inspect" | "reception";
};

export const allServices: Service[] = [
  {
    slug: "general-repair",
    name: "General repair",
    approved: false,
    summary: "Something isn't working the way it should. Tell us what you're noticing and we'll talk through it.",
    metaDescription: "Request general auto repair. Describe what's going on with your vehicle and start with a simple request.",
    problem: {
      heading: "When something isn't right",
      body: "A new noise, a warning on the dash, a car that doesn't feel the way it used to. You don't need to know what's wrong to ask for help — describe what you're seeing, hearing or feeling and that's enough to start the conversation.",
    },
    scope: [
      "Repairs to common vehicle systems, discussed with you before any work begins",
      "A conversation about what was found and the options available",
      "Clear next steps that you agree to first",
    ],
    exclusions: [
      "No work is started from a website request alone",
      "No prices or timeframes are quoted on this page — those are discussed directly",
      "Specific repair types are confirmed by the shop, case by case",
    ],
    faq: [
      { question: "Do I need to know what's wrong before I send a request?", answer: "No. The request form asks you to describe the symptoms in your own words. That's enough to start." },
      { question: "Which makes and models do you work on?", answer: null },
    ],
    art: "bay",
  },
  {
    slug: "diagnostics",
    name: "Diagnostics",
    approved: false,
    summary: "A warning light or a problem you can't pin down. Start by describing when and how it happens.",
    metaDescription: "Request vehicle diagnostics. Describe the warning light or symptom and start with a simple request.",
    problem: {
      heading: "When you're not sure what the problem is",
      body: "A check-engine light, a symptom that comes and goes, or a problem that's hard to describe. The more detail you can share — when it happens, how often, what changed — the more useful the first conversation will be.",
    },
    scope: [
      "Looking into warning lights and hard-to-explain symptoms",
      "An explanation of what was found, in plain language",
      "A discussion of options before any repair is agreed",
    ],
    exclusions: [
      "A website request is not a diagnosis",
      "Diagnostic fees, if any, are not listed here — ask when you're contacted",
      "Finding the cause and fixing it are discussed as separate steps",
    ],
    faq: [
      { question: "What details help most?", answer: "The form asks for your vehicle's year, make and model, plus a description. When the problem happens, how often, and any warning lights are all useful to include." },
      { question: "Is there a fee for diagnostics?", answer: null },
    ],
    art: "inspect",
  },
  {
    slug: "maintenance",
    name: "Maintenance",
    approved: false,
    summary: "Routine service to keep your vehicle on schedule. Let us know what's due or what you'd like checked.",
    metaDescription: "Request routine vehicle maintenance. Tell us what's due and start with a simple request.",
    problem: {
      heading: "When it's time for routine service",
      body: "Scheduled service is easy to put off. If something is due — or you're not sure what is — send the details of your vehicle and what you'd like looked at.",
    },
    scope: [
      "Routine, scheduled service items for your vehicle",
      "A conversation about what's due and what can wait",
      "Agreement on what will be done before work begins",
    ],
    exclusions: [
      "No maintenance packages or prices are published on this page",
      "A preferred date on the form is a request, not a booked appointment",
      "Available services are confirmed by the shop directly",
    ],
    faq: [
      { question: "Can I ask for a specific day?", answer: "Yes — the request form has an optional preferred date. It's a request, not a confirmed appointment." },
      { question: "Which maintenance services do you offer?", answer: null },
    ],
    art: "reception",
  },
];

/** Preview shows every proposed service; a public build shows approved ones only. */
export const services: Service[] = business.ownerApproved ? allServices.filter((s) => s.approved) : allServices;

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export const processSteps = [
  { title: "Tell us what you need", body: "Send a short request with your vehicle details and what you're noticing." },
  { title: "Discuss the details", body: "The shop follows up using the contact method you provide to talk it through." },
  { title: "Agree on the next steps", body: "Nothing is scheduled or started until you've agreed to it." },
] as const;

/**
 * Homepage FAQ. Answers that describe how this website's form works are
 * drafted; anything that is shop policy (estimates, pricing) is left null
 * for the owner to supply.
 */
export const homeFaq: FaqItem[] = [
  {
    question: "What information should I provide about my vehicle?",
    answer: "The request form asks for the year, make and model, and a description of what you're noticing. Only your name, a way to reach you, the type of service and the description are required.",
  },
  {
    question: "Can I request a preferred appointment date?",
    answer: "Yes. The form includes an optional preferred date. It is a request only — it doesn't book or confirm an appointment.",
  },
  { question: "How will I receive an estimate?", answer: null },
];

export const gallery: { art: Service["art"]; caption: string; alt: string }[] = [
  { art: "bay", caption: "Service bay", alt: "Illustration of a car raised on a lift inside a service bay" },
  { art: "inspect", caption: "Inspecting a vehicle", alt: "Illustration of a mechanic looking under the open hood of a car" },
  { art: "reception", caption: "Reception", alt: "Illustration of a reception counter with a waiting area" },
];
