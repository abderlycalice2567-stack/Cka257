import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { DemoNotice } from "@/components/ui/demo-notice";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Informations de confidentialité (maquette — à finaliser avec le propriétaire).",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Informations" title="Politique de confidentialité" />
      <Section>
        <div className="mx-auto max-w-3xl space-y-6">
          <DemoNotice title="Projet de texte — à valider">
            Ce texte est un modèle de démonstration. Il ne constitue pas un avis juridique et doit
            être complété puis validé par le propriétaire (et, si nécessaire, un conseil juridique)
            avant toute mise en ligne. Nous n’affirmons aucune conformité réglementaire acquise.
          </DemoNotice>

          <div className="prose-light space-y-5 text-slate">
            <div>
              <h2 className="text-lg font-bold text-navy-900">1. Portée de cette maquette</h2>
              <p className="mt-2">
                Dans cet aperçu, les formulaires (contact, prière, don) fonctionnent en mode
                démonstration : les données saisies ne sont ni enregistrées, ni transmises, ni
                utilisées. Aucune information personnelle réelle n’est collectée.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900">2. En production (à confirmer)</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Données éventuellement collectées (ex. formulaire de contact) et finalités.</li>
                <li>Base légale, durée de conservation et minimisation.</li>
                <li>Prestataires (hébergement, e-mail, paiement) et transferts éventuels.</li>
                <li>Droits des personnes et point de contact dédié.</li>
                <li>Cookies et mesure d’audience (si utilisés — aucun pistage inutile).</li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900">3. Responsable du traitement</h2>
              <p className="mt-2">À renseigner par le propriétaire de Jona Radio.</p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
