import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { DemoNotice } from "@/components/ui/demo-notice";
import { PrayerForm } from "@/components/forms/prayer-form";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Demandes de prière",
  description: "Déposez une intention de prière (démonstration, aucune donnée réelle).",
};

export default function PrayerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Communauté"
        title="Demandes de prière"
        description="Partagez une intention et laissez l’équipe la porter. Cette démonstration illustre un parcours respectueux de la vie privée."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <DemoNotice>
              Démonstration : les intentions saisies utilisent des <strong>données synthétiques</strong>{" "}
              et ne sont <strong>ni enregistrées ni transmises</strong> à Jona Radio ou à un tiers.
            </DemoNotice>
            <div className="card p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-800">
                <ShieldIcon width={18} height={18} />
              </span>
              <h2 className="mt-4 font-bold text-navy-900">En production</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate">
                <li>• Consentement explicite et minimisation des données.</li>
                <li>• Protection anti-abus (honeypot, limitation, CAPTCHA/Turnstile si justifié).</li>
                <li>• Traitement sécurisé et accès administrateur restreint.</li>
                <li>• Conservation limitée et possibilité de suppression.</li>
              </ul>
            </div>
          </div>
          <PrayerForm />
        </div>
      </Section>
    </>
  );
}
