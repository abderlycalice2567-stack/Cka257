import Link from "next/link";
import { business, formatPhone, isPreview, locationLabel } from "@/config/business";

function Pending({ what }: { what: string }) {
  if (!isPreview) return null;
  return <p className="draft-note">{what} not yet confirmed by the owner. Hidden on the public site until verified.</p>;
}

/** Shows verified contact details only. Unverified items are never rendered as fact. */
export function ContactPanel() {
  const { phone, email, hours, address, directionsUrl } = business;
  const hasStreet = address.confirmed && address.street;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card p-6" aria-labelledby="contact-reach">
        <h2 id="contact-reach" className="text-xl font-bold">
          Get in touch
        </h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-sm font-semibold text-navy-600">Phone</dt>
            <dd className="mt-1">
              {phone ? (
                <a href={`tel:${phone}`} className="inline-flex min-h-[44px] items-center text-lg font-semibold text-brand underline underline-offset-4" data-track="phone-click">
                  {formatPhone(phone)}
                </a>
              ) : (
                <Pending what="Phone number" />
              )}
            </dd>
          </div>
          {email ? (
            <div>
              <dt className="text-sm font-semibold text-navy-600">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${email}`} className="inline-flex min-h-[44px] items-center text-brand underline underline-offset-4">
                  {email}
                </a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-sm font-semibold text-navy-600">Online</dt>
            <dd className="mt-2">
              <Link href="/request" className="btn-primary">
                Request service
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-6" aria-labelledby="contact-visit">
        <h2 id="contact-visit" className="text-xl font-bold">
          Location and hours
        </h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-sm font-semibold text-navy-600">Location</dt>
            <dd className="mt-1">
              {hasStreet ? (
                <address className="not-italic leading-relaxed">
                  {address.street}
                  <br />
                  {locationLabel()} {address.postalCode}
                </address>
              ) : (
                <>
                  <p>{locationLabel()}</p>
                  <div className="mt-2">
                    <Pending what="Exact address" />
                  </div>
                </>
              )}
              {hasStreet && directionsUrl ? (
                <a href={directionsUrl} className="mt-2 inline-flex min-h-[44px] items-center font-semibold text-brand underline underline-offset-4" rel="noopener" data-track="directions-click">
                  Get directions
                </a>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-navy-600">Hours</dt>
            <dd className="mt-1">
              {hours ? (
                <table className="w-full max-w-xs text-left">
                  <caption className="sr-only">Opening hours</caption>
                  <tbody>
                    {hours.map((h) => (
                      <tr key={h.day}>
                        <th scope="row" className="py-1 pr-4 font-medium">
                          {h.day}
                        </th>
                        <td className="py-1 text-navy-600">{"closed" in h ? "Closed" : `${h.open} – ${h.close}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Pending what="Opening hours" />
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
