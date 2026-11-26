import Link from "next/link";
import { business, isHoursVerified, isPhoneVerified } from "@/config/business";
import { buttonClass } from "./ui";

/** Shows only verified contact details. Unverified items are listed as pending in prototype mode. */
export function ContactPanel({ prototype }: { prototype: boolean }) {
  const pending: string[] = [];
  if (!isPhoneVerified()) pending.push("phone number");
  if (!isHoursVerified()) pending.push("business hours");
  if (!business.serviceArea.verified) pending.push("service area");
  if (!business.email.verified) pending.push("email address");

  return (
    <div className="rounded-card border border-pine/15 bg-white p-6 sm:p-8">
      <h2 className="font-heading text-2xl font-extrabold text-pine-ink">Get in touch</h2>
      <dl className="mt-6 space-y-5">
        {isPhoneVerified() && (
          <div>
            <dt className="font-heading font-bold text-pine-ink">Phone</dt>
            <dd>
              <a href={`tel:${business.phone.value.e164}`} data-track="phone-click" className="inline-flex min-h-touch items-center text-lg text-pine underline underline-offset-4">
                {business.phone.value.display}
              </a>
            </dd>
          </div>
        )}
        {business.email.verified && business.email.value && (
          <div>
            <dt className="font-heading font-bold text-pine-ink">Email</dt>
            <dd>
              <a href={`mailto:${business.email.value}`} className="inline-flex min-h-touch items-center text-pine underline underline-offset-4">
                {business.email.value}
              </a>
            </dd>
          </div>
        )}
        {isHoursVerified() && (
          <div>
            <dt className="font-heading font-bold text-pine-ink">Hours</dt>
            {business.hours.value.map((h) => (
              <dd key={h.days} className="text-muted">
                {h.days}: {h.open}–{h.close}
              </dd>
            ))}
          </div>
        )}
        {business.serviceArea.verified && (
          <div>
            <dt className="font-heading font-bold text-pine-ink">Service area</dt>
            <dd className="text-muted">{business.serviceArea.value}</dd>
          </div>
        )}
        {business.location.verified && (
          <div>
            <dt className="font-heading font-bold text-pine-ink">Based in</dt>
            <dd className="text-muted">
              {business.location.value.locality}, {business.location.value.region}
            </dd>
          </div>
        )}
      </dl>
      {prototype && pending.length > 0 && (
        <p className="mt-6 rounded-card border border-dashed border-pine/50 bg-tan-light px-4 py-3 text-sm text-muted">
          <span className="font-bold text-pine-ink">Pending owner confirmation: </span>
          {pending.join(", ")}. These are hidden until verified.
        </p>
      )}
      <p className="mt-6 text-muted">The easiest way to reach us is to send a request — tell us about your yard and the owner will follow up.</p>
      <Link href="/request" className={buttonClass("primary", "mt-4 w-full sm:w-auto")}>
        Request lawn service
      </Link>
    </div>
  );
}
