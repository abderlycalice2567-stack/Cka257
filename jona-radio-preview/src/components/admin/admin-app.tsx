"use client";

import { useState } from "react";
import Link from "next/link";
import { programs as seedPrograms, news as seedNews } from "@/lib/content";
import { CheckIcon, ShieldIcon } from "@/components/icons";

/**
 * SIMULATED content-management dashboard.
 *
 * Everything here runs on in-memory, synthetic demo data in the browser. It is
 * NOT connected to the owner's WordPress site or any backend, stores nothing,
 * and performs no real authentication. The "sign-in" screen is cosmetic and
 * exists only to illustrate the intended UX. Real production auth would be
 * server-side with MFA and least-privilege roles (see docs).
 */

type Tab = "overview" | "programs" | "news" | "schedule" | "home" | "analytics" | "team";

const TABS: { id: Tab; label: string; implemented: boolean }[] = [
  { id: "overview", label: "Tableau de bord", implemented: true },
  { id: "programs", label: "Émissions", implemented: true },
  { id: "news", label: "Actualités", implemented: true },
  { id: "schedule", label: "Programmation", implemented: false },
  { id: "home", label: "Page d’accueil", implemented: false },
  { id: "analytics", label: "Analytique", implemented: false },
  { id: "team", label: "Équipe & accès", implemented: false },
];

export function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  if (!authed) return <SimulatedLogin onEnter={() => setAuthed(true)} />;

  return (
    <div className="min-h-[70vh] bg-navy-50/40">
      <div className="border-b border-gold-500 bg-gold-500/15">
        <div className="container-page py-2 text-center text-xs font-medium text-navy-800">
          Environnement de <strong>démonstration</strong> · données synthétiques · non connecté au
          site réel · aucune donnée enregistrée
        </div>
      </div>
      <div className="container-page grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Navigation administration" className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium ${
                tab === t.id ? "bg-navy-800 text-ivory" : "text-navy-700 hover:bg-white"
              }`}
            >
              <span>{t.label}</span>
              {!t.implemented && (
                <span className={`text-[9px] uppercase ${tab === t.id ? "text-gold-400" : "text-slate"}`}>
                  simulé
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setAuthed(false)}
            className="mt-4 w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-slate hover:bg-white"
          >
            Se déconnecter
          </button>
        </nav>

        <div>
          {tab === "overview" && <Overview />}
          {tab === "programs" && <ProgramsAdmin />}
          {tab === "news" && <NewsAdmin />}
          {tab === "schedule" && <Placeholder title="Programmation (grille)" items={["Glisser-déposer des créneaux", "Récurrence hebdomadaire", "Rediffusions"]} />}
          {tab === "home" && <Placeholder title="Édition de la page d’accueil" items={["Bloc héros", "Émissions mises en avant", "Bannières d’annonce"]} />}
          {tab === "analytics" && <Placeholder title="Analytique (non sensible)" items={["Écoutes par émission", "Pages vues", "Appareils"]} note="Afficherait des mesures agrégées et anonymes uniquement." />}
          {tab === "team" && <Placeholder title="Équipe & permissions" items={["Rôles (admin, éditeur, animateur)", "Moindre privilège", "Authentification à deux facteurs (MFA)"]} note="En production : comptes individuels, MFA obligatoire, journal d’audit." />}
        </div>
      </div>
    </div>
  );
}

function SimulatedLogin({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-3xl border border-navy-100 bg-white p-8 shadow-card">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold uppercase text-gold-700">
          <ShieldIcon width={14} height={14} /> Connexion simulée
        </div>
        <h1 className="mt-4 text-2xl font-bold text-navy-900">Administration Jona Radio</h1>
        <p className="mt-2 text-sm text-slate">
          Démonstration uniquement. Cet écran <strong>ne vérifie aucun identifiant</strong> et ne
          se connecte à aucun système. En production, l’accès serait protégé côté serveur avec
          authentification forte (MFA) et rôles à privilèges minimaux.
        </p>
        <div className="mt-6 space-y-3">
          <input className="w-full rounded-xl border border-navy-100 px-4 py-3 text-sm" placeholder="Identifiant (ignoré)" aria-label="Identifiant (ignoré)" />
          <input className="w-full rounded-xl border border-navy-100 px-4 py-3 text-sm" placeholder="Mot de passe (ignoré)" type="password" aria-label="Mot de passe (ignoré)" />
        </div>
        <button onClick={onEnter} className="btn-navy mt-5 w-full">
          Entrer dans la démo
        </button>
        <Link href="/" className="mt-4 block text-center text-xs text-slate underline">
          Retour au site
        </Link>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">{children}</div>;
}

function Overview() {
  const stats = [
    { label: "Émissions", value: seedPrograms.length },
    { label: "Actualités", value: seedNews.length },
    { label: "Brouillons", value: 2 },
    { label: "Écoutes (démo)", value: "—" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Tableau de bord</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-slate">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-navy-900">{s.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="font-bold text-navy-900">Ce que le propriétaire pourrait faire ici</h2>
        <ul className="mt-3 grid gap-2 text-sm text-slate sm:grid-cols-2">
          {["Ajouter / modifier des émissions", "Publier des annonces", "Mettre à jour la page d’accueil", "Gérer la grille de diffusion", "Consulter des mesures non sensibles", "Gérer l’équipe et les permissions"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="text-green-600"><CheckIcon width={16} height={16} /></span>
              {t}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ProgramsAdmin() {
  const [items, setItems] = useState(seedPrograms.map((p) => ({ slug: p.slug, title: p.title, category: p.category, published: true })));
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Émissions</h1>
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="new-prog" className="sr-only">Nom de la nouvelle émission</label>
          <input
            id="new-prog"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nom d’une nouvelle émission (démo)"
            className="flex-1 rounded-xl border border-navy-100 px-4 py-2.5 text-sm"
          />
          <button
            className="btn-navy"
            onClick={() => {
              if (!draft.trim()) return;
              setItems((prev) => [
                { slug: `demo-${Date.now()}`, title: draft.trim(), category: "Démo", published: false },
                ...prev,
              ]);
              setDraft("");
            }}
          >
            Ajouter (démo)
          </button>
        </div>
      </Card>
      <Card>
        <ul className="divide-y divide-navy-100">
          {items.map((it) => (
            <li key={it.slug} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-navy-900">{it.title}</p>
                <p className="text-xs text-slate">{it.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setItems((prev) => prev.map((x) => (x.slug === it.slug ? { ...x, published: !x.published } : x)))}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${it.published ? "bg-green-100 text-green-700" : "bg-navy-50 text-slate"}`}
                >
                  {it.published ? "Publié" : "Brouillon"}
                </button>
                <button
                  onClick={() => setItems((prev) => prev.filter((x) => x.slug !== it.slug))}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate">Les modifications restent en mémoire (démo) et ne sont pas sauvegardées.</p>
      </Card>
    </div>
  );
}

function NewsAdmin() {
  const [items] = useState(seedNews.map((n) => ({ ...n })));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Actualités</h1>
      <Card>
        <ul className="divide-y divide-navy-100">
          {items.map((n) => (
            <li key={n.slug} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-navy-900">{n.title}</p>
                <p className="text-xs text-slate">{n.category} · {new Date(n.date).toLocaleDateString("fr-FR")}</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Publié</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate">Éditeur riche, planification et aperçu seraient disponibles en production.</p>
      </Card>
    </div>
  );
}

function Placeholder({ title, items, note }: { title: string; items: string[]; note?: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        <span className="rounded-full bg-gold-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase text-gold-700">Fonction simulée</span>
      </div>
      <Card>
        <p className="text-sm text-slate">Cet écran illustre une capacité prévue mais non implémentée dans la maquette :</p>
        <ul className="mt-3 space-y-2 text-sm text-navy-800">
          {items.map((i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              {i}
            </li>
          ))}
        </ul>
        {note && <p className="mt-4 rounded-xl bg-navy-50 p-3 text-xs text-slate">{note}</p>}
      </Card>
    </div>
  );
}
