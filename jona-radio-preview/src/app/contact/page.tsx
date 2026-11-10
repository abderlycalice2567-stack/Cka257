import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { DemoNotice } from "@/components/ui/demo-notice";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez Jona Radio (formulaire de démonstration).",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Écrivez-nous"
        description="Une question, une suggestion, une demande de partenariat ? Ce formulaire de démonstration montre un parcours sécurisé et accessible."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <DemoNotice>
              Formulaire de démonstration : la saisie est validée côté serveur, protégée contre le
              spam (honeypot + limitation de débit), mais <strong>aucune donnée n’est enregistrée
              ni envoyée</strong>. Les coordonnées officielles de la station sont à confirmer.
            </DemoNotice>
            <div className="card p-6 text-sm text-slate">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-700">
                Coordonnées
              </h2>
              <p className="mt-3">
                À renseigner par le propriétaire (adresse e-mail, téléphone, réseaux sociaux
                vérifiés). Nous n’inventons pas ces informations.
              </p>
            </div>
          </div>
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
