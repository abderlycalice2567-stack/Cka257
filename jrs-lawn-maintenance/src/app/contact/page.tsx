import { business, isPrototype } from "@/config/business";
import { ContactPanel } from "@/components/ContactPanel";
import { Container } from "@/components/ui";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Contact",
  description: `Contact ${business.name}. Send a lawn service request and the owner will follow up.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="bg-tan-light py-14 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="font-heading text-4xl font-extrabold text-pine-ink sm:text-5xl">Contact</h1>
          <p className="mt-4 text-lg text-muted">Questions about mowing, edging or regular maintenance? We&apos;d be glad to hear from you.</p>
        </div>
        <div className="lg:col-span-7">
          <ContactPanel prototype={isPrototype()} />
        </div>
      </Container>
    </div>
  );
}
