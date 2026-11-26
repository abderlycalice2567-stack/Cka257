const DEFAULT_STEPS = [
  { title: "Tell us what you need", body: "Fill out a short request with your yard details and the service you're interested in." },
  { title: "Discuss the details", body: "The owner reviews your request and reaches out to talk it through." },
  { title: "Agree on the next steps", body: "Nothing is booked automatically — you decide together what happens next." },
];

export function Process({ steps = DEFAULT_STEPS, headingId = "process-title", title = "How it works" }: { steps?: { title: string; body: string }[]; headingId?: string; title?: string }) {
  return (
    <div>
      <h2 id={headingId} className="font-heading text-3xl font-extrabold text-pine-ink">
        {title}
      </h2>
      <ol className="mt-8 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-card border border-pine/15 bg-white p-6">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-pine font-heading font-extrabold text-white">
              {i + 1}
            </span>
            <h3 className="mt-4 font-heading text-lg font-bold text-pine-ink">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h3>
            <p className="mt-2 text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
