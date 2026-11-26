import { business, isPrototype } from "@/config/business";
import { CTA } from "@/components/CTA";
import { DraftNote, Section } from "@/components/ui";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "About",
  description: `About ${business.name} — dependable, recurring lawn maintenance for homeowners.`,
  path: "/about",
});

const PHILOSOPHY = [
  { title: "Keep it simple", body: "Routine maintenance done consistently, rather than elaborate projects." },
  { title: "Talk first", body: "Every job starts with a conversation about what you actually need." },
  { title: "No surprises", body: "Nothing is booked or charged until you and the owner have agreed on it." },
];

export default function AboutPage() {
  const prototype = isPrototype();
  const story = business.aboutStory;
  return (
    <>
      <Section labelledBy="page-title" tone="cream">
        <h1 id="page-title" className="font-heading text-4xl font-extrabold text-pine-ink sm:text-5xl">
          About {business.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">Meet the business behind the service.</p>
      </Section>
      <Section labelledBy="story-title">
        <div className="max-w-3xl">
          <h2 id="story-title" className="font-heading text-3xl font-extrabold text-pine-ink">
            Our story
          </h2>
          {story.length > 0 ? (
            story.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-lg text-muted">
                {p}
              </p>
            ))
          ) : (
            <>
              <p className="mt-4 text-lg text-muted">This section will tell the owner&apos;s story in their own words — how the business started, who does the work and what they care about.</p>
              {prototype && <DraftNote>owner story, team, credentials and any licensing or insurance details must be supplied and approved by the owner. Nothing is invented here.</DraftNote>}
            </>
          )}
        </div>
      </Section>
      <Section labelledBy="philosophy-title" tone="cream">
        <h2 id="philosophy-title" className="font-heading text-3xl font-extrabold text-pine-ink">
          How we approach the work
        </h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {PHILOSOPHY.map((p) => (
            <li key={p.title} className="rounded-card border border-pine/15 bg-white p-6">
              <h3 className="font-heading text-lg font-bold text-pine-ink">{p.title}</h3>
              <p className="mt-2 text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
        {prototype && <DraftNote>service philosophy is proposed wording for the owner to edit.</DraftNote>}
      </Section>
      <CTA />
    </>
  );
}
