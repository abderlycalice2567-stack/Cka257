/**
 * Homepage FAQ. Answers are `null` until the owner supplies them; the FAQ
 * component shows a draft notice in the private demo and hides unanswered
 * questions when SITE_MODE=live. Do not invent prices or policies.
 */
export const homepageFaq: { q: string; a: string | null }[] = [
  { q: "What information should I provide about my vehicle?", a: null },
  { q: "Can I request a preferred appointment date?", a: null },
  { q: "How will I receive an estimate?", a: null },
];

export const processSteps = [
  { title: "Tell us what you need", body: "Send a short request describing your vehicle and what's going on." },
  { title: "Discuss the details", body: "The shop follows up to ask questions and talk through options." },
  { title: "Agree on the next steps", body: "Nothing is booked or started until you've agreed on what happens next." },
];
