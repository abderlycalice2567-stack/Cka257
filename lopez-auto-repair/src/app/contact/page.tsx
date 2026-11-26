import { business, locationLabel } from "@/config/business";
import { ContactPanel } from "@/components/ContactPanel";
import { PageHeader } from "@/components/PageHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description: `Contact ${business.name} in ${locationLabel()} or send a service request online.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title={`Contact ${business.name}`} intro="The quickest way to get started is a service request — it takes a couple of minutes." />
      <section className="section">
        <div className="container">
          <ContactPanel />
        </div>
      </section>
    </>
  );
}
