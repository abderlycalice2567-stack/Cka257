import type { Metadata } from "next";
import { business } from "@/config/business";
import { isPreview } from "@/config/site";
import { CTA } from "@/components/CTA";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "About",
  description: `About ${business.name}: the people behind the service and how we work.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="Meet the business behind the service." />
      <section className="section">
        <div className="container-page prose-page max-w-3xl">
          <h2 className="!mt-0">Our story</h2>
          {business.story ? (
            business.story.map((p) => <p key={p.slice(0, 32)}>{p}</p>)
          ) : (
            isPreview && <div className="placeholder-note mt-4">Preview note: the owner&apos;s approved story goes here. Nothing has been written on the owner&apos;s behalf.</div>
          )}

          {(business.team.length > 0 || isPreview) && <h2>Team</h2>}
          {business.team.length > 0 ? (
            <ul>
              {business.team.map((m) => (
                <li key={m.name}><strong className="text-navy">{m.name}</strong> — {m.role}</li>
              ))}
            </ul>
          ) : (
            isPreview && <div className="placeholder-note mt-4">Preview note: real team members only, added with their approval.</div>
          )}

          {(business.credentials.length > 0 || isPreview) && <h2>Credentials</h2>}
          {business.credentials.length > 0 ? (
            <ul>
              {business.credentials.map((c) => <li key={c}>{c}</li>)}
            </ul>
          ) : (
            isPreview && <div className="placeholder-note mt-4">Preview note: verified certifications and memberships only. None are shown until confirmed.</div>
          )}

          <h2>How we work</h2>
          <p>
            You tell us what you need, we discuss the details with you, and nothing goes ahead until the next
            steps are agreed.
          </p>
        </div>
      </section>
      <CTA />
    </>
  );
}
