import { business, type DayHours } from "@/config/business";
import { isPreview } from "@/config/site";

export function HoursList({ hours, className = "" }: { hours: readonly DayHours[]; className?: string }) {
  return (
    <dl className={`space-y-1 ${className}`}>
      {hours.map((h) => (
        <div key={h.day} className="flex justify-between gap-6">
          <dt>{h.day}</dt>
          <dd>{"closed" in h ? "Closed" : `${h.open} – ${h.close}`}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Renders only verified contact facts. Unverified items are omitted (and flagged in preview). */
export function ContactPanel() {
  const missing = [
    !business.phone && "phone number",
    !business.address && !business.serviceArea && "address or service area",
    !business.hours && "opening hours",
  ].filter(Boolean) as string[];

  return (
    <div className="card">
      <h2 className="text-xl font-bold">Contact details</h2>
      <dl className="mt-4 space-y-4">
        {business.phone && (
          <div>
            <dt className="text-sm font-semibold text-navy">Phone</dt>
            <dd>
              <a href={`tel:${business.phone}`} className="inline-flex min-h-[44px] items-center font-semibold text-teal underline underline-offset-4" data-track="phone-click">
                {business.phoneDisplay ?? business.phone}
              </a>
            </dd>
          </div>
        )}
        {business.email && (
          <div>
            <dt className="text-sm font-semibold text-navy">Email</dt>
            <dd>
              <a href={`mailto:${business.email}`} className="inline-flex min-h-[44px] items-center text-teal underline underline-offset-4">
                {business.email}
              </a>
            </dd>
          </div>
        )}
        {business.address && (
          <div>
            <dt className="text-sm font-semibold text-navy">Address</dt>
            <dd className="text-muted">
              {business.address.street}
              <br />
              {business.address.city}, {business.address.region} {business.address.postalCode}
              {business.directionsUrl && (
                <>
                  <br />
                  <a href={business.directionsUrl} rel="noopener" className="inline-flex min-h-[44px] items-center font-semibold text-teal underline underline-offset-4" data-track="directions-click">
                    Get directions
                  </a>
                </>
              )}
            </dd>
          </div>
        )}
        {business.serviceArea && (
          <div>
            <dt className="text-sm font-semibold text-navy">Service area</dt>
            <dd className="text-muted">{business.serviceArea}</dd>
          </div>
        )}
        {business.hours && (
          <div>
            <dt className="text-sm font-semibold text-navy">Hours</dt>
            <dd className="mt-1 text-muted">
              <HoursList hours={business.hours} />
            </dd>
          </div>
        )}
      </dl>
      {missing.length > 0 && isPreview && (
        <p className="placeholder-note mt-4">
          Preview note: {missing.join(", ")} not yet confirmed by the owner, so {missing.length > 1 ? "they are" : "it is"} not shown.
        </p>
      )}
      {missing.length === 3 && !business.email && !isPreview && (
        <p className="mt-4 text-muted">Please use the request form to get in touch.</p>
      )}
    </div>
  );
}
