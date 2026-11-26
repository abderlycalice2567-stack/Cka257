import { processSteps } from "@/content/services";

export function ProcessSteps({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {processSteps.map((step, i) => (
        <li key={step.title} className="relative rounded-card border border-navy-100 bg-white p-6">
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-navy-800 font-display text-base font-bold text-white">
            {i + 1}
          </span>
          <Heading className="mt-4 text-lg font-bold">
            <span className="sr-only">Step {i + 1}: </span>
            {step.title}
          </Heading>
          <p className="mt-2 leading-relaxed text-navy-600">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
