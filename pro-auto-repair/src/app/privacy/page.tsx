import type { Metadata } from "next";
import { business } from "@/config/business";
import { isPreview } from "@/config/site";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${business.name} handles information submitted through this website.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy notice" />
      <section className="section">
        <div className="container-page prose-page max-w-3xl">
          {isPreview && (
            <div className="placeholder-note">
              Preview note: this is a draft describing how the prototype is built. The owner must review it,
              set the retention period and contact point, and have it checked before launch. It is not legal
              advice.
            </div>
          )}
          <h2>What we collect</h2>
          <p>When you send a service request we collect what you enter in the form:</p>
          <ul>
            <li>Your name and a phone number and/or email address</li>
            <li>The service you need and your description of the issue</li>
            <li>Optional vehicle year, make and model, and a preferred date</li>
            <li>The time you gave consent to be contacted, and your optional marketing choice</li>
          </ul>
          <p>We do not ask for payment details, identity documents or account passwords.</p>

          <h2>How we use it</h2>
          <p>
            Your details are used to respond to your request. We only send reminders or offers if you ticked
            the separate, optional box.
          </p>

          <h2>Who processes it</h2>
          <ul>
            <li>Website hosting: Vercel</li>
            <li>Request storage: Supabase (database)</li>
            <li>Notification email to the shop: Resend</li>
          </ul>
          <p>Requests can be read only by authorized staff. They are never public.</p>

          <h2>How long we keep it</h2>
          {isPreview ? (
            <div className="placeholder-note mt-4">Retention period: to be agreed with the owner.</div>
          ) : (
            <p>We keep requests only as long as needed to respond and for our service records.</p>
          )}

          <h2>Technical data</h2>
          <p>
            To limit spam, the server briefly uses your IP address to count submissions. This site sets no
            advertising cookies.
          </p>

          <h2>Your choices</h2>
          <p>You can ask to see, correct or delete the details you sent.</p>
          {business.email || business.phone ? (
            <p>Contact: {business.email ?? business.phoneDisplay ?? business.phone}</p>
          ) : (
            isPreview && <div className="placeholder-note mt-4">Privacy contact: to be supplied by the owner.</div>
          )}
        </div>
      </section>
    </>
  );
}
