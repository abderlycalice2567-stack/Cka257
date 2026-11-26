import Link from "next/link";
import { business, hasPhone, locationLabel } from "@/config/business";
import { IconPhone } from "@/components/Icons";

export function HoursList({ onDark = false }: { onDark?: boolean }) {
  if (!business.hours) return <p className={onDark ? "" : "text-ink-muted"}>Hours to be confirmed.</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
      {business.hours.map((h) => (
        <div key={h.day} className="contents">
          <dt className="font-semibold">{h.day}</dt>
          <dd>{h.open && h.close ? `${h.open} – ${h.close}` : "Closed"}</dd>
        </div>
      ))}
    </dl>
  );
}

const Pending = ({ children }: { children: React.ReactNode }) => <p className="draft-note">{children}</p>;

export function ContactPanel() {
  const { street, city, region, postalCode } = business.address;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card" aria-labelledby="contact-reach">
        <h2 id="contact-reach" className="text-xl font-bold">
          Get in touch
        </h2>
        <div className="mt-4 space-y-4">
          <Link href="/request" className="btn-primary w-full sm:w-auto">
            Schedule a service request
          </Link>
          {hasPhone() ? (
            <a href={`tel:${business.phone}`} className="btn-secondary w-full sm:w-auto" data-track="phone-click">
              <IconPhone /> {business.phoneDisplay}
            </a>
          ) : (
            <Pending>Phone number not yet verified, so it isn&apos;t shown. Please use the request form.</Pending>
          )}
          {business.email && (
            <p>
              Email:{" "}
              <a className="font-semibold text-amber-800 underline" href={`mailto:${business.email}`}>
                {business.email}
              </a>
            </p>
          )}
        </div>
      </section>
      <section className="card" aria-labelledby="contact-hours">
        <h2 id="contact-hours" className="text-xl font-bold">
          Hours
        </h2>
        <div className="mt-4">
          {business.hours ? <HoursList /> : <Pending>Weekly and holiday hours to be confirmed by the owner.</Pending>}
          {business.holidayHoursNote && <p className="mt-3 text-sm text-ink-muted">{business.holidayHoursNote}</p>}
        </div>
      </section>
      <section className="card md:col-span-2" aria-labelledby="contact-location">
        <h2 id="contact-location" className="text-xl font-bold">
          Location {business.serviceArea ? "& service area" : ""}
        </h2>
        <div className="mt-4 space-y-3">
          {street && city ? (
            <>
              <address className="not-italic">
                {street}
                <br />
                {city}, {region} {postalCode}
              </address>
              <a
                className="inline-flex min-h-touch items-center font-semibold text-amber-800 underline"
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${street}, ${city}, ${region} ${postalCode ?? ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                data-track="directions-click"
              >
                Get directions (opens Google Maps)
              </a>
            </>
          ) : (
            <Pending>Exact address for {locationLabel()} to be confirmed. Directions are hidden until it&apos;s verified.</Pending>
          )}
          {business.serviceArea && <p className="text-ink-muted">Service area: {business.serviceArea}</p>}
        </div>
      </section>
    </div>
  );
}
