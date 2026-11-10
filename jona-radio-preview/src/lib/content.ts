/**
 * DEMONSTRATION CONTENT ONLY.
 *
 * Everything in this file is clearly-labelled placeholder data created for the
 * redesign proposal. We have NOT invented real testimonials, listener
 * statistics, pastor biographies, verified schedules or ministry affiliations.
 * Program names below that are confirmed as public pages on jonaradio.net are
 * flagged `sourced: true`; all other details (hosts, times, descriptions) are
 * demo placeholders to be replaced with owner-supplied content.
 */

export type Program = {
  slug: string;
  title: string;
  /** true = page/title confirmed on the public site; false = demo placeholder */
  sourced: boolean;
  host: string; // DEMO unless owner-confirmed
  category: string;
  schedule: string; // DEMO placeholder
  duration: string;
  summary: string;
  description: string[];
  accent: "gold" | "navy";
};

export const programs: Program[] = [
  {
    slug: "meditation-du-matin",
    title: "Méditation du matin",
    sourced: true, // /show/meditation-du-matin/ exists on the public site
    host: "Animateur à confirmer",
    category: "Méditation",
    schedule: "Lun – Ven · 06:00 (exemple)",
    duration: "30 min",
    summary:
      "Un temps court pour commencer la journée avec une pensée d’espérance et une prière.",
    description: [
      "« Méditation du matin » est une émission confirmée sur le site public de Jona Radio. Le contenu ci-dessous est une mise en page de démonstration.",
      "Dans la version finale, cette page présenterait l’animateur, les derniers épisodes, un lecteur audio à la demande et la possibilité de recevoir la méditation par courriel.",
    ],
    accent: "gold",
  },
  {
    slug: "louange-et-adoration",
    title: "Louange & Adoration",
    sourced: false,
    host: "À confirmer",
    category: "Musique",
    schedule: "Tous les jours · 12:00 (démo)",
    duration: "60 min",
    summary:
      "Une sélection musicale de louange contemporaine et de cantiques intemporels.",
    description: [
      "Émission de DÉMONSTRATION. Les titres, l’animateur et l’horaire sont des exemples destinés à illustrer la mise en page.",
      "La version finale afficherait la liste de lecture en cours, l’historique des morceaux et les artistes mis en avant.",
    ],
    accent: "navy",
  },
  {
    slug: "parole-et-vie",
    title: "Parole & Vie",
    sourced: false,
    host: "À confirmer",
    category: "Enseignement",
    schedule: "Mer · 19:00 (démo)",
    duration: "45 min",
    summary:
      "Un enseignement biblique accessible pour nourrir la foi au quotidien.",
    description: [
      "Émission de DÉMONSTRATION présentée pour illustrer une page d’émission type.",
      "La version finale intégrerait les notes de l’épisode, les références bibliques et le podcast.",
    ],
    accent: "navy",
  },
  {
    slug: "temoignages",
    title: "Témoignages d’espérance",
    sourced: false,
    host: "À confirmer",
    category: "Témoignages",
    schedule: "Ven · 20:00 (démo)",
    duration: "45 min",
    summary:
      "Des histoires de vie et de foi. (Aucun témoignage réel n’est inventé dans cette démo.)",
    description: [
      "Émission de DÉMONSTRATION. Aucun témoignage réel n’est présenté — cette page illustre uniquement la mise en forme.",
      "La version finale ne publierait que des témoignages fournis et validés par la station, avec consentement.",
    ],
    accent: "gold",
  },
  {
    slug: "jeunesse",
    title: "Génération Jona",
    sourced: false,
    host: "À confirmer",
    category: "Jeunesse",
    schedule: "Sam · 17:00 (démo)",
    duration: "60 min",
    summary: "Une émission pour les jeunes : musique, discussions et invités.",
    description: [
      "Émission de DÉMONSTRATION destinée à montrer la diversité de la grille.",
      "La version finale serait alimentée par l’équipe de la station via le tableau de bord d’administration.",
    ],
    accent: "navy",
  },
  {
    slug: "priere-du-soir",
    title: "Prière du soir",
    sourced: false,
    host: "À confirmer",
    category: "Prière",
    schedule: "Tous les jours · 21:00 (démo)",
    duration: "30 min",
    summary: "Un moment de recueillement et de prière pour clôturer la journée.",
    description: [
      "Émission de DÉMONSTRATION.",
      "La version finale pourrait se connecter à la page « Demandes de prière » pour porter les intentions reçues (avec consentement).",
    ],
    accent: "gold",
  },
];

export function getProgram(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}

export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  body: string[];
  demo: boolean;
};

export const news: NewsItem[] = [
  {
    slug: "refonte-proposition",
    title: "À propos de cette démonstration de refonte",
    date: "2026-11-10",
    category: "Information",
    demo: true,
    excerpt:
      "Cette actualité explique le statut de la démonstration : une proposition indépendante, non officielle.",
    body: [
      "Cette page fait partie d’une PROPOSITION de refonte indépendante présentée au propriétaire de Jona Radio. Il ne s’agit pas du site officiel.",
      "Tous les articles d’actualité de cette section sont des exemples de démonstration. Dans la version finale, ils seraient rédigés et publiés par l’équipe de la station via le tableau de bord.",
    ],
  },
  {
    slug: "grille-des-programmes",
    title: "Exemple : une nouvelle grille des programmes",
    date: "2026-11-05",
    category: "Programmes",
    demo: true,
    excerpt:
      "Exemple de démonstration illustrant comment une annonce de programmation apparaîtrait.",
    body: [
      "Article de DÉMONSTRATION. Le contenu est fictif et sert uniquement à montrer la mise en page des annonces.",
      "La station pourrait publier ici les nouveautés de la grille, les émissions spéciales et les rendez-vous à venir.",
    ],
  },
  {
    slug: "emission-speciale",
    title: "Exemple : émission spéciale de fin d’année",
    date: "2026-10-28",
    category: "Événements",
    demo: true,
    excerpt:
      "Exemple de démonstration pour une diffusion spéciale ou un événement communautaire.",
    body: [
      "Article de DÉMONSTRATION. Aucun événement réel n’est annoncé.",
      "La version finale permettrait d’associer un événement à une date, un lieu et un rappel.",
    ],
  },
];

export function getNews(slug: string): NewsItem | undefined {
  return news.find((n) => n.slug === slug);
}

/**
 * "Verset du jour".
 * Uses a public-domain French Bible text (Louis Segond 1910, domaine public)
 * so no licensing claim is required. Reference shown so the owner can swap in
 * their preferred (and appropriately licensed) translation.
 */
export type Verse = { ref: string; text: string; translation: string };

export const verses: Verse[] = [
  {
    ref: "Jérémie 29:11",
    text: "Car je connais les projets que j’ai formés sur vous, dit l’Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l’espérance.",
    translation: "Louis Segond 1910 (domaine public)",
  },
  {
    ref: "Psaume 118:24",
    text: "C’est ici la journée que l’Éternel a faite : qu’elle soit pour nous un sujet d’allégresse et de joie !",
    translation: "Louis Segond 1910 (domaine public)",
  },
  {
    ref: "Ésaïe 40:31",
    text: "Mais ceux qui se confient en l’Éternel renouvellent leur force. Ils prennent leur vol comme les aigles ; ils courent, et ne se lassent point.",
    translation: "Louis Segond 1910 (domaine public)",
  },
  {
    ref: "Philippiens 4:13",
    text: "Je puis tout par celui qui me fortifie.",
    translation: "Louis Segond 1910 (domaine public)",
  },
];

/** Deterministic "verse of the day" so server and client render identically. */
export function verseOfTheDay(date = new Date()): Verse {
  const dayIndex = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000,
  );
  return verses[dayIndex % verses.length];
}

/** Engagement figures shown in the UI are explicitly labelled as illustrative. */
export const illustrativeStats = [
  { label: "Émissions dans la grille", value: `${programs.length}`, note: "démo" },
  { label: "Heures de diffusion / jour", value: "24", note: "exemple" },
  { label: "Langue principale", value: "Français", note: "confirmé" },
  { label: "Diffusion", value: "En ligne", note: "confirmé" },
];
