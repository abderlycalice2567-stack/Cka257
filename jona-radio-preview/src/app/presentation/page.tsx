import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/section";
import { ListenButton } from "@/components/player/listen-button";
import { CheckIcon, ShieldIcon, ArrowIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Présentation",
  description: "Démonstration guidée de la proposition de refonte pour Jona Radio.",
  robots: { index: false, follow: false },
};

const steps = [
  { id: "observations", n: 1, label: "Constat actuel" },
  { id: "design", n: 2, label: "Nouvelle identité" },
  { id: "ecoute", n: 3, label: "Expérience d’écoute" },
  { id: "mobile", n: 4, label: "Mobile" },
  { id: "engagement", n: 5, label: "Engagement" },
  { id: "securite-demo", n: 6, label: "Sécurité (démo)" },
  { id: "securite-prod", n: 7, label: "Sécurité (production)" },
  { id: "roadmap", n: 8, label: "Feuille de route" },
  { id: "benefices", n: 9, label: "Bénéfices" },
  { id: "suite", n: 10, label: "Prochaines étapes" },
];

function Step({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-navy-100 py-12 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-gold-400">
          {n}
        </span>
        <h2 className="text-2xl font-bold text-navy-900">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function BeforeAfter({ before, after }: { before: string[]; after: string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-navy-100 bg-navy-50/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">Aujourd’hui (observé)</p>
        <ul className="mt-3 space-y-2 text-sm text-slate">
          {before.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate/50" />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-gold-500/40 bg-gold-500/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">Proposé (cette maquette)</p>
        <ul className="mt-3 space-y-2 text-sm text-navy-800">
          {after.map((a) => (
            <li key={a} className="flex gap-2">
              <span className="mt-0.5 text-green-600">
                <CheckIcon width={15} height={15} />
              </span>
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PresentationPage() {
  return (
    <>
      <section className="bg-navy-900 text-ivory">
        <div className="container-page py-16 sm:py-20">
          <Badge tone="gold">Mode présentation · usage commercial interne</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Jona Radio, nouvelle génération
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ivory/75">
            Une démonstration guidée de ce que pourrait devenir le site : design premium, écoute
            sans friction, engagement de la communauté et sécurité moderne — tout en conservant
            l’identité et la mission de la station.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ListenButton size="lg" />
            <Link href="/" className="btn-outline border-white/25 bg-white/5 text-ivory hover:text-ivory">
              Ouvrir le site de démo
            </Link>
          </div>
          <p className="mt-6 max-w-2xl rounded-xl bg-white/5 p-3 text-xs text-ivory/70">
            Avertissement : proposition indépendante, non officielle. Les fonctionnalités montrées
            sont des démonstrations et ne sont pas déployées sur le site réel. Nous n’affirmons pas
            que le site actuel a été piraté ou qu’il est dangereux.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Sommaire de la présentation" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1 text-sm">
            {steps.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-navy-700 hover:bg-navy-50">
                  <span className="text-xs font-bold text-gold-700">{s.n}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div>
          <Step id="observations" n={1} title="Constat sur le site actuel">
            <p className="mb-5 text-slate">
              Observations issues d’une revue publique et non intrusive (sans test d’intrusion). Il
              s’agit de pistes d’amélioration, pas d’un diagnostic de compromission.
            </p>
            <BeforeAfter
              before={[
                "WordPress + Elementor + thème Blocksy + Fluent Forms (empreinte de modèle générique).",
                "En-têtes de sécurité navigateur en grande partie absents (HSTS, CSP réelle, etc.).",
                "Divulgation de versions (PHP, extensions) facilitant l’empreinte technique.",
                "Pas d’authentification e-mail (SPF/DMARC) sur le domaine.",
                "Dépendance à plusieurs scripts tiers, sans intégrité (SRI).",
              ]}
              after={[
                "Architecture sur mesure (Next.js/TypeScript) au rendu premium.",
                "En-têtes stricts + CSP par nonce appliqués par défaut.",
                "Aucune divulgation de version inutile.",
                "Plan d’authentification e-mail prêt (SPF/DKIM/DMARC).",
                "Dépendances tierces minimisées, polices auto-hébergées.",
              ]}
            />
            <p className="mt-4 text-xs text-slate">
              Un comparatif visuel « avant/après » peut être ajouté avec des captures d’écran du
              site actuel, utilisées à des fins de présentation et dûment attribuées.
            </p>
          </Step>

          <Step id="design" n={2} title="Nouvelle identité visuelle">
            <p className="text-slate">
              Palette proposée — bleu nuit profond, or chaleureux, ivoire — typographie soignée
              (titres en serif élégant, texte lisible), cartes modernes et animations subtiles.
              L’identité « Jona Radio » et sa mission sont conservées.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                ["#101B33", "Bleu nuit"],
                ["#D8AE61", "Or"],
                ["#F8F6F0", "Ivoire"],
                ["#FFFFFF", "Blanc"],
                ["#64748B", "Gris ardoise"],
              ].map(([hex, name]) => (
                <div key={hex} className="flex items-center gap-2 rounded-full border border-navy-100 bg-white py-1.5 pl-1.5 pr-4">
                  <span className="h-7 w-7 rounded-full border border-black/10" style={{ background: hex }} />
                  <span className="text-xs font-medium text-navy-800">{name} <span className="text-slate">{hex}</span></span>
                </div>
              ))}
            </div>
          </Step>

          <Step id="ecoute" n={3} title="Une expérience d’écoute sans friction">
            <BeforeAfter
              before={["Lecteur peu mis en avant.", "Écoute interrompue lors de la navigation."]}
              after={[
                "Bouton « Écouter en direct » proéminent, partout.",
                "Lecteur persistant : la lecture continue d’une page à l’autre.",
                "États clairs : chargement, lecture, pause, erreur, hors ligne.",
                "Volume, sourdine, reprise après coupure, commandes média du système.",
              ]}
            />
            <div className="mt-5">
              <ListenButton />
            </div>
          </Step>

          <Step id="mobile" n={4} title="Pensé pour le mobile">
            <p className="text-slate">
              Mise en page responsive (iPhone, Android, tablette, ordinateur), typographie et
              contrastes accessibles, navigation au clavier, images optimisées. L’écoute est
              accessible en un geste, sans parcours multiple.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              {["iPhone", "Android", "Tablette", "Ordinateur", "Bas débit"].map((d) => (
                <span key={d} className="rounded-full bg-navy-50 px-3 py-1.5 font-medium text-navy-700">{d}</span>
              ))}
            </div>
          </Step>

          <Step id="engagement" n={5} title="Nouvelles fonctions d’engagement">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Verset du jour", "Un rendez-vous quotidien pour encourager la foi."],
                ["Demandes de prière", "Un parcours respectueux de la vie privée (démo sans données réelles)."],
                ["Actualités & annonces", "Pour les émissions spéciales et la vie de la communauté."],
                ["Soutien / don", "Interface prête pour un prestataire agréé (démo sans paiement)."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-navy-100 bg-white p-5">
                  <h3 className="font-bold text-navy-900">{t}</h3>
                  <p className="mt-1 text-sm text-slate">{d}</p>
                </div>
              ))}
            </div>
          </Step>

          <Step id="securite-demo" n={6} title="Sécurité déjà appliquée dans la démo">
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "En-têtes : HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.",
                "CSP par nonce + frame-ancestors (anti-clickjacking), sans unsafe-inline pour les scripts.",
                "Aucune divulgation de version ; en-tête X-Powered-By supprimé.",
                "Polices auto-hébergées ; aucune ressource HTTP non sécurisée.",
                "Formulaires validés côté serveur, honeypot + limitation de débit, sans collecte réelle.",
                "Aperçu non indexé et protégeable par mot de passe.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 rounded-xl border border-navy-100 bg-white p-4 text-sm text-navy-800">
                  <span className="mt-0.5 text-gold-600"><ShieldIcon width={16} height={16} /></span>
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate">
              Correspondance détaillée avec les constats F-01 à F-09 : voir{" "}
              <code className="text-navy-800">docs/FINDINGS-TO-FIXES.md</code>.
            </p>
          </Step>

          <Step id="securite-prod" n={7} title="Sécurité nécessitant l’accès du propriétaire">
            <p className="text-slate">
              Certaines améliorations ne peuvent être réalisées qu’avec un accès autorisé au domaine
              et à l’hébergement :
            </p>
            <ul className="mt-3 space-y-2 text-sm text-navy-800">
              {[
                "Publication des enregistrements DNS SPF/DKIM/DMARC (authentification e-mail).",
                "DNSSEC et enregistrement CAA sur le domaine.",
                "Sauvegardes testées, surveillance, MFA sur les comptes d’administration.",
                "Correctifs continus de l’éventuelle installation WordPress existante.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  {t}
                </li>
              ))}
            </ul>
          </Step>

          <Step id="roadmap" n={8} title="Feuille de route de mise en œuvre">
            <ol className="space-y-3">
              {[
                ["Semaine 1–2", "Validation du design, contenus fournis par la station, intégration du flux autorisé."],
                ["Semaine 3–4", "Pages finalisées, formulaires reliés à un e-mail authentifié, tests d’accessibilité."],
                ["Semaine 5–6", "Durcissement production, DNS (SPF/DMARC, DNSSEC/CAA), sauvegardes, surveillance."],
                ["Continu", "Maintenance, correctifs, évaluations de sécurité périodiques (sur autorisation)."],
              ].map(([when, what]) => (
                <li key={when} className="flex gap-4 rounded-2xl border border-navy-100 bg-white p-4">
                  <span className="shrink-0 rounded-full bg-navy-800 px-3 py-1 text-xs font-semibold text-ivory">{when}</span>
                  <span className="text-sm text-slate">{what}</span>
                </li>
              ))}
            </ol>
          </Step>

          <Step id="benefices" n={9} title="Bénéfices pour la station">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Confiance", "Un site rapide, soigné et sécurisé renforce la crédibilité auprès des auditeurs."],
                ["Audience", "Écoute facilitée, mobile et SEO améliorés pour toucher plus de monde."],
                ["Sérénité", "Sauvegardes, surveillance et maintenance réduisent les risques et le temps d’arrêt."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl bg-navy-900 p-5 text-ivory">
                  <h3 className="font-bold text-gold-400">{t}</h3>
                  <p className="mt-2 text-sm text-ivory/80">{d}</p>
                </div>
              ))}
            </div>
          </Step>

          <Step id="suite" n={10} title="Prochaines étapes">
            <div className="rounded-3xl bg-gradient-to-br from-gold-500 to-gold-700 p-8 text-navy-900">
              <ol className="space-y-2 text-sm font-medium">
                <li>1. Recueillir les retours du propriétaire sur cette maquette.</li>
                <li>2. Confirmer les contenus officiels et l’autorisation d’utiliser le flux.</li>
                <li>3. Définir le périmètre, le calendrier et le budget.</li>
                <li>4. Déployer sur un aperçu privé, puis planifier la mise en production.</li>
                <li>5. (Optionnel) Évaluation de sécurité approfondie, sur autorisation écrite.</li>
              </ol>
              <Link href="/contact" className="btn-navy mt-6">
                Démarrer la conversation <ArrowIcon width={16} height={16} />
              </Link>
            </div>
          </Step>
        </div>
      </div>
    </>
  );
}
