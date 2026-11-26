import { ButtonLink } from "./ui";

export function CTA({ title = "Ready to discuss your needs?", body = "Send a quick request and the owner will follow up.", headingId = "cta-title" }: { title?: string; body?: string; headingId?: string }) {
  return (
    <section aria-labelledby={headingId} className="bg-pine py-16 text-white">
      <div className="mx-auto max-w-content px-4 text-center sm:px-6 lg:px-8">
        <h2 id={headingId} className="font-heading text-3xl font-extrabold">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">{body}</p>
        <div className="mt-8">
          <ButtonLink href="/request" variant="light">
            Request lawn service
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
