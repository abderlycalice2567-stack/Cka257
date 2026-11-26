import { process as steps } from "@/content/services";

export function ProcessSteps() {
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title} className="card">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-display font-bold text-white" aria-hidden="true">
            {i + 1}
          </span>
          <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
          <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
