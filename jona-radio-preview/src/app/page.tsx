import Link from "next/link";
import { Section, SectionHeading, Badge } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ProgramCard } from "@/components/ui/program-card";
import { ListenButton } from "@/components/player/listen-button";
import { LivePanel } from "@/components/player/live-panel";
import { ArrowIcon, HeartIcon, ShieldIcon, CheckIcon } from "@/components/icons";
import { programs, news, verseOfTheDay, illustrativeStats } from "@/lib/content";

export default function Home() {
  const verse = verseOfTheDay();
  const featured = programs.slice(0, 3);
  const latestNews = news.slice(0, 3);

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-navy-900 text-ivory">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full bg-navy-700 blur-3xl" />
          <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-gold-700/30 blur-3xl" />
        </div>
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <Reveal>
              <Badge tone="gold">Radio chrétienne en ligne · 24/7</Badge>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
                Jona Radio — Une voix d’espoir, de foi et d’inspiration.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/75">
                Connectez-vous à une programmation qui nourrit votre foi, inspire votre quotidien et
                vous accompagne partout.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ListenButton size="lg" />
                <Link href="/nos-emissions" className="btn-outline border-white/25 bg-white/5 px-6 py-4 text-ivory hover:border-gold-500 hover:text-ivory">
                  Découvrir nos émissions
                  <ArrowIcon width={18} height={18} />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {illustrativeStats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-2xl font-bold text-gold-400">{s.value}</dt>
                    <dd className="mt-1 text-xs leading-tight text-ivory/60">
                      {s.label}
                      <span className="ml-1 opacity-60">({s.note})</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <LivePanel />
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------- FEATURED PROGRAMS */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="À l’antenne"
            title="Nos émissions à la une"
            description="Un aperçu de la grille. Les émissions confirmées sur le site public sont marquées ; les autres sont des exemples de démonstration."
          />
          <Link href="/nos-emissions" className="btn-outline">
            Toute la grille <ArrowIcon width={16} height={16} />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <ProgramCard program={p} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------- VERSE OF THE DAY */}
      <Section tone="navy">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            light
            eyebrow="Verset du jour"
            title="Un temps d’inspiration quotidien"
            description="Un verset renouvelé chaque jour pour encourager les auditeurs. (Texte en domaine public ; la station pourra choisir sa traduction.)"
          />
          <Reveal>
            <figure className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10">
              <blockquote className="font-display text-2xl font-semibold leading-snug text-ivory sm:text-3xl">
                « {verse.text} »
              </blockquote>
              <figcaption className="mt-5 text-sm text-gold-400">
                {verse.ref}
                <span className="ml-2 text-ivory/50">· {verse.translation}</span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Section>

      {/* ----------------------------------------------- PRAYER + DONATION */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="card flex h-full flex-col justify-between p-8">
              <div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-800">
                  <HeartIcon />
                </span>
                <h3 className="mt-5 text-2xl font-bold text-navy-900">Demandes de prière</h3>
                <p className="mt-3 text-slate">
                  Partagez une intention et laissez l’équipe la porter dans la prière. Dans cette
                  démo, aucune donnée réelle n’est enregistrée ni transmise.
                </p>
              </div>
              <Link href="/demandes-de-priere" className="btn-navy mt-6 self-start">
                Déposer une intention <ArrowIcon width={16} height={16} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="card flex h-full flex-col justify-between bg-gradient-to-br from-navy-800 to-navy-900 p-8 text-ivory">
              <div>
                <Badge tone="gold">Démonstration</Badge>
                <h3 className="mt-5 text-2xl font-bold">Soutenir Jona Radio</h3>
                <p className="mt-3 text-ivory/75">
                  Une interface de don prête à être reliée à un prestataire de paiement agréé après
                  autorisation. Aucun paiement réel n’est collecté dans cette maquette.
                </p>
              </div>
              <Link href="/soutenir" className="btn-gold mt-6 self-start">
                Voir la page de don <ArrowIcon width={16} height={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------------------------------- NEWS */}
      <Section tone="muted">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Actualités" title="Dernières annonces" description="Exemples de démonstration. La station publierait ici ses nouvelles via le tableau de bord." />
          <Link href="/actualites" className="btn-outline">
            Toutes les actualités <ArrowIcon width={16} height={16} />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {latestNews.map((n, i) => (
            <Reveal key={n.slug} delay={i * 80}>
              <Link href={`/actualites/${n.slug}`} className="card card-hover flex h-full flex-col p-6">
                <div className="flex items-center gap-2 text-xs">
                  <Badge tone="muted">{n.category}</Badge>
                  {n.demo && <span className="font-semibold uppercase text-gold-700">démo</span>}
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy-900">{n.title}</h3>
                <p className="mt-2 flex-1 text-sm text-slate">{n.excerpt}</p>
                <time className="mt-4 text-xs text-slate" dateTime={n.date}>
                  {new Date(n.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------- SECURITY TEASER */}
      <Section tone="navy">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionHeading
            light
            eyebrow="Sécurité & fiabilité"
            title="Une base technique moderne et sécurisée"
            description="Cette maquette applique des bonnes pratiques de sécurité dès la conception : en-têtes de sécurité stricts, politique de contenu (CSP) par nonce, zéro dépendance de script tierce inutile."
          />
          <Reveal>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "En-têtes HSTS, CSP, Referrer-Policy, Permissions-Policy",
                "CSP par nonce (sans unsafe-inline pour les scripts)",
                "Polices auto-hébergées, aucune ressource HTTP non sécurisée",
                "Formulaires validés côté serveur, anti-spam, sans collecte réelle",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-ivory/85">
                  <span className="mt-0.5 text-gold-400">
                    <ShieldIcon width={18} height={18} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/presentation" className="btn-gold mt-6">
              Voir toutes les améliorations <ArrowIcon width={16} height={16} />
            </Link>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------------- CTA */}
      <Section>
        <div className="rounded-3xl bg-gradient-to-br from-gold-500 to-gold-700 px-8 py-14 text-center text-navy-900 sm:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
            Écoutez Jona Radio, où que vous soyez.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-navy-900/80">
            Un lecteur rapide, accessible et persistant pendant la navigation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ListenButton size="lg" className="bg-navy-900 text-ivory hover:bg-navy-800" />
            <Link href="/ecouter-en-direct" className="btn-outline border-navy-900/20 bg-white/40 px-6 py-4">
              Page d’écoute dédiée
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-navy-900/70">
            <CheckIcon width={14} height={14} /> Démonstration — le statut « en direct » ne s’affiche que si le flux est réellement connecté.
          </p>
        </div>
      </Section>
    </>
  );
}
