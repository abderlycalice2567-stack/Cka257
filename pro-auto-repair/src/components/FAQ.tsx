import { business } from "@/config/business";
import { isPreview } from "@/config/site";

type Question = { id: string; question: string };

/**
 * Answers come only from the owner (business.faqAnswers). In preview, unanswered
 * questions are shown with a visible "awaiting owner" note; in production they are hidden.
 */
export function FAQ({ items, heading = "Frequently asked questions" }: { items: readonly Question[]; heading?: string }) {
  const answers: Record<string, string> = business.faqAnswers;
  const visible = items.filter((q) => answers[q.id] || isPreview);
  if (visible.length === 0) return null;
  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight">{heading}</h2>
      <div className="mt-6 divide-y divide-line rounded-card border border-line bg-white">
        {visible.map((q) => (
          <details key={q.id} className="group px-5">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-navy [&::-webkit-details-marker]:hidden">
              {q.question}
              <svg className="shrink-0 transition-transform group-open:rotate-45" width="20" height="20" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M10 4v12M4 10h12" />
              </svg>
            </summary>
            <div className="pb-5">
              {answers[q.id] ? (
                <p className="leading-relaxed text-muted">{answers[q.id]}</p>
              ) : (
                <p className="placeholder-note">Preview note: the owner will supply this answer. No prices or policies are assumed.</p>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
