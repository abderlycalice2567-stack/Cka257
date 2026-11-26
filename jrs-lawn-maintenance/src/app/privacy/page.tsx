import { business, isPrototype } from "@/config/business";
import { Container, DraftNote } from "@/components/ui";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Privacy Notice",
  description: `How ${business.name} handles the information you send through this website.`,
  path: "/privacy",
});

/**
 * Describes what this codebase actually does. If you add analytics, cookies,
 * new vendors or change retention, update this page in the same change.
 */
export default function PrivacyPage() {
  const contactLine = business.email.verified && business.email.value ? business.email.value : business.phone.verified ? business.phone.value.display : null;
  return (
    <div className="py-14 sm:py-20">
      <Container>
        <article className="max-w-3xl [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-pine-ink [&_li]:mt-2 [&_p]:mt-4 [&_p]:text-muted [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted">
          <h1 className="font-heading text-4xl font-extrabold text-pine-ink sm:text-5xl">Privacy notice</h1>
          {isPrototype() && <DraftNote>this notice describes how the prototype is built. The owner must review it, set the retention period and add contact details before launch.</DraftNote>}

          <h2>What we collect</h2>
          <p>We only collect what you type into the request form:</p>
          <ul>
            <li>Your name, and a phone number and/or email address</li>
            <li>The service you&apos;re interested in and your description of the job</li>
            <li>Optional details: property ZIP code, yard size, how often you&apos;d like service, a preferred start date and access notes</li>
            <li>Whether you agreed to be contacted about your request (required) and whether you opted in to occasional updates (optional), with the time you agreed</li>
          </ul>
          <p>Please don&apos;t send passwords, payment card details or sensitive documents through the form. We never ask for them.</p>

          <h2>What we don&apos;t collect</h2>
          <p>This website doesn&apos;t use advertising or analytics cookies, doesn&apos;t create accounts and doesn&apos;t take payments. Our hosting provider keeps standard technical logs (such as IP address and browser type) for security and to prevent abuse; we use your IP address briefly to limit repeated form submissions.</p>

          <h2>How we use it</h2>
          <ul>
            <li>To contact you about the request you sent</li>
            <li>To send you occasional updates — only if you ticked the optional box</li>
          </ul>
          <p>We don&apos;t sell your information or share it for others&apos; marketing.</p>

          <h2>Who processes it for us</h2>
          <ul>
            <li>
              <strong>Vercel</strong> — website hosting
            </li>
            <li>
              <strong>Supabase</strong> — secure database where requests are stored
            </li>
            <li>
              <strong>Resend</strong> — sends the business an email notification about your request
            </li>
          </ul>

          <h2>How long we keep it</h2>
          <p>{business.name} keeps requests only as long as needed to respond and to keep basic records of work discussed. The specific retention period will be set by the owner before launch.</p>

          <h2>Your choices</h2>
          <p>You can ask us to show you, correct or delete the information you sent{contactLine ? ` by contacting ${contactLine}` : ""}. You can withdraw from optional updates at any time.</p>

          <p className="text-sm">Last updated: pending owner approval.</p>
        </article>
      </Container>
    </div>
  );
}
