import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { DemoNotice } from "@/components/ui/demo-notice";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales (maquette — informations à confirmer par le propriétaire).",
};

const rows = [
  ["Éditeur du site", "À confirmer (nom de l’organisme / responsable)"],
  ["Statut juridique", "À confirmer"],
  ["Adresse", "À confirmer"],
  ["Contact", "À confirmer (e-mail / téléphone vérifiés)"],
  ["Directeur de la publication", "À confirmer"],
  ["Hébergement (production)", "À définir selon le choix du propriétaire"],
];

export default function LegalPage() {
  return (
    <>
      <PageHeader eyebrow="Informations" title="Mentions légales" />
      <Section>
        <div className="mx-auto max-w-3xl space-y-6">
          <DemoNotice title="Informations manquantes — à fournir par le propriétaire">
            Nous n’inventons aucune information légale (éditeur, statut, adresse, responsable de
            publication, hébergeur). Les champs ci-dessous sont des espaces réservés à compléter
            avec les informations officielles et vérifiées.
          </DemoNotice>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody>
                {rows.map(([k, v], i) => (
                  <tr key={k} className={i % 2 ? "bg-navy-50/50" : ""}>
                    <th scope="row" className="w-1/3 px-5 py-4 font-semibold text-navy-900">
                      {k}
                    </th>
                    <td className="px-5 py-4 text-slate">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate">
            Cette maquette est une proposition de refonte indépendante et n’est pas affiliée à Jona
            Radio. Les marques et contenus éventuels appartiennent à leurs propriétaires respectifs.
          </p>
        </div>
      </Section>
    </>
  );
}
