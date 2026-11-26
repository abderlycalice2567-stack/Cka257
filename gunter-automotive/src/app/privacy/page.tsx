import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { business } from "@/config/business";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Gunter Automotive handles information submitted through this website.",
  alternates: { canonical: "/privacy" },
};

/**
 * DRAFT privacy notice describing what THIS codebase actually does. The owner
 * must confirm the controller identity, contact, retention period and vendors
 * (and have it reviewed) before launch. Bracketed items are launch blockers.
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Privacy" title="Privacy notice" intro="Draft. To be reviewed and approved by the business before launch." />
      <section className="section pt-10">
        <div className="container max-w-3xl space-y-8 text-ink-muted [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold">
          <div>
            <h2>Who we are</h2>
            <p>
              This website is operated by {business.legalName ?? `${business.name} [legal name to be confirmed]`}.
              {business.email ? ` Contact: ${business.email}.` : " [Privacy contact to be confirmed.]"}
            </p>
          </div>
          <div>
            <h2>What we collect</h2>
            <p>When you send a service request we collect what you enter in the form:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>your name, and your phone number and/or email address;</li>
              <li>optional vehicle year, make and model;</li>
              <li>the service you need, your description and an optional preferred date;</li>
              <li>the time you gave consent to be contacted, and whether you opted in to updates.</li>
            </ul>
            <p className="mt-2">
              We don&apos;t ask for payment details or identity documents, and the site doesn&apos;t create accounts. Our hosting provider keeps
              standard technical logs (such as IP address) to keep the service secure. Your IP address is used briefly to limit repeated
              submissions and isn&apos;t stored with your request.
            </p>
          </div>
          <div>
            <h2>How we use it</h2>
            <p>
              We use your request only to contact you about it. If you separately opted in to updates, we may also send occasional updates, and you
              can opt out at any time. We don&apos;t sell your information.
            </p>
          </div>
          <div>
            <h2>Service providers</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Vercel: website hosting.</li>
              <li>Supabase: secure database storage of requests.</li>
              <li>Resend: delivering request notifications to the shop by email.</li>
            </ul>
            <p className="mt-2">[Vendors and data locations to be confirmed for the production setup.]</p>
          </div>
          <div>
            <h2>How long we keep it</h2>
            <p>[Retention period to be agreed with the owner, for example 12 months after your last contact], after which requests are deleted.</p>
          </div>
          <div>
            <h2>Cookies</h2>
            <p>This site doesn&apos;t use advertising or analytics cookies. [Update if analytics are added.]</p>
          </div>
          <div>
            <h2>Your choices</h2>
            <p>
              You can ask to see, correct or delete the information you sent us by contacting the business
              {business.email ? ` at ${business.email}` : " [contact to be confirmed]"}.
            </p>
          </div>
          <p className="text-sm">
            Last updated: [date of owner approval]. <Link href="/contact" className="font-semibold text-amber-800 underline">Contact details</Link>
          </p>
        </div>
      </section>
    </>
  );
}
