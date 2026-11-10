import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { DemoNotice } from "@/components/ui/demo-notice";
import { DonationDemo } from "@/components/forms/donation-demo";

export const metadata: Metadata = {
  title: "Soutenir Jona Radio",
  description: "Interface de don de démonstration (aucun paiement réel).",
};

export default function SupportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Faire un don · Démonstration"
        title="Soutenir Jona Radio"
        description="Votre soutien permet à la station de continuer à émettre. Cette page montre l’interface de don ; elle ne traite aucun paiement réel."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <DemoNotice title="Démonstration — aucun paiement réel">
              Cette interface est prête à être reliée à un <strong>prestataire de paiement
              agréé</strong> (Stripe, HelloAsso, PayPal…) après autorisation du propriétaire. Aucune
              coordonnée bancaire n’est demandée, collectée ou stockée dans la maquette, et le site
              ne traite jamais directement les paiements.
            </DemoNotice>
            <div className="card p-6 text-sm text-slate">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-700">
                Mise en production
              </h2>
              <ul className="mt-3 space-y-2">
                <li>• Statut juridique de l’organisme et reçus fiscaux à confirmer.</li>
                <li>• Intégration via redirection/éléments hébergés (PCI-DSS côté prestataire).</li>
                <li>• Aucune donnée de carte ne transite par nos serveurs.</li>
              </ul>
            </div>
          </div>
          <DonationDemo />
        </div>
      </Section>
    </>
  );
}
