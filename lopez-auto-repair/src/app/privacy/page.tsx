import Link from "next/link";
import { business, isPreview } from "@/config/business";
import { PageHeader } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Privacy", description: `How ${business.name} handles information sent through this website.`, path: "/privacy" });

function Pending({ children }: { children: React.ReactNode }) {
  return isPreview ? <p className="draft-note mt-3">{children}</p> : null;
}

/**
 * This text describes what THIS codebase actually does. Items marked pending
 * are owner decisions (retention, contact, final vendors) and must be filled
 * in — and reviewed by the owner — before launch.
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy notice" intro={`What this website collects when you send a service request to ${business.name}, and what happens to it.`} />
      <section className="section">
        <div className="container max-w-3xl space-y-10 leading-relaxed text-navy-600 [&_h2]:text-2xl [&_h2]:font-extrabold [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
          {isPreview ? <p className="draft-note">Draft. This notice must be completed and approved by the owner before the site is published.</p> : null}

          <div>
            <h2>What we collect</h2>
            <p>Only what you type into the service request form:</p>
            <ul>
              <li>Your name, and a phone number and/or email address</li>
              <li>The type of service and your description of what you&apos;re noticing</li>
              <li>Optionally: vehicle year, make and model, and a preferred date</li>
              <li>Your consent choices and the time you gave them</li>
            </ul>
            <p>Please don&apos;t include payment details or sensitive documents — the form doesn&apos;t ask for them and they aren&apos;t needed.</p>
          </div>

          <div>
            <h2>How it&apos;s used</h2>
            <p>
              To contact you about the request you sent. We only send marketing messages if you ticked the separate, optional box, and you can withdraw that at any time.
            </p>
          </div>

          <div>
            <h2>Cookies and tracking</h2>
            <p>This website sets no advertising or analytics cookies and loads no third-party trackers. To limit spam, the server briefly counts requests per network address in memory; this is not stored.</p>
          </div>

          <div>
            <h2>Who processes it</h2>
            <p>Requests are stored in a database and a notification is emailed to the business. The service providers used for this are:</p>
            <ul>
              <li>Website hosting — Vercel</li>
              <li>Database — Supabase</li>
              <li>Notification email — Resend</li>
            </ul>
            <Pending>Vendor list reflects the proposed technical stack; confirm the final providers at launch.</Pending>
            <p>Your information is not sold or shared for anyone else&apos;s marketing.</p>
          </div>

          <div>
            <h2>How long it&apos;s kept</h2>
            {isPreview ? <Pending>Retention period to be agreed with the owner and enforced in the database.</Pending> : <p>Requests are kept only as long as needed to respond and for the business&apos;s records.</p>}
          </div>

          <div>
            <h2>Your choices</h2>
            <p>You can ask to see, correct or delete the information you sent.</p>
            {business.email || business.phone ? (
              <p>
                Get in touch via the <Link href="/contact" className="font-semibold text-brand underline underline-offset-2">contact page</Link>.
              </p>
            ) : (
              <Pending>Privacy contact (phone or email) to be supplied by the owner.</Pending>
            )}
          </div>

          {isPreview ? (
            <div>
              <h2>About this preview</h2>
              <p>
                While the form is in demo mode, nothing you enter is stored or sent. The form labels this clearly, and the confirmation page says so.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
