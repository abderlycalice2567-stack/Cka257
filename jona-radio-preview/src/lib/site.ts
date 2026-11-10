/**
 * Site-wide configuration for the Jona Radio redesign PROPOSAL.
 *
 * This is an independent proof-of-concept. It is NOT the official Jona Radio
 * website and is not affiliated with or endorsed by Jona Radio.
 */

export const site = {
  name: "Jona Radio",
  proposalTagline: "Proposition de refonte — démonstration indépendante",
  description:
    "Démonstration de refonte pour Jona Radio : une radio chrétienne en ligne. Voix d’espoir, de foi et d’inspiration.",
  // Example preview URL only — NOT the official domain.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://jona-radio-preview.example-agency.com",
  official: {
    // Public, verifiable from the live site (used only to attribute the source).
    website: "https://www.jonaradio.net",
    language: "fr",
  },
  /**
   * Stream endpoint is injected via env so no availability claim is hard-coded.
   * The player only ever reports "En direct" when the browser audio element is
   * actually playing. See components/player.
   */
  stream: {
    url: process.env.NEXT_PUBLIC_STREAM_URL || "",
    metadataUrl: process.env.NEXT_PUBLIC_STREAM_METADATA_URL || "",
  },
} as const;

export type NavItem = { label: string; href: string; cta?: boolean; demo?: boolean };

export const primaryNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Écouter en direct", href: "/ecouter-en-direct" },
  { label: "Nos émissions", href: "/nos-emissions" },
  { label: "À propos", href: "/a-propos" },
  { label: "Actualités", href: "/actualites" },
  { label: "Contact", href: "/contact" },
  { label: "Faire un don", href: "/soutenir", cta: true, demo: true },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Écouter",
    items: [
      { label: "En direct", href: "/ecouter-en-direct" },
      { label: "Nos émissions", href: "/nos-emissions" },
      { label: "Actualités", href: "/actualites" },
    ],
  },
  {
    title: "La station",
    items: [
      { label: "À propos", href: "/a-propos" },
      { label: "Demandes de prière", href: "/demandes-de-priere" },
      { label: "Soutenir Jona Radio", href: "/soutenir", demo: true },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Informations",
    items: [
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Mode présentation", href: "/presentation" },
    ],
  },
];

/**
 * Social links verified as present on the public site (home page markup links
 * to these platforms). Specific handles require owner confirmation, so these
 * point to the platforms generically and are marked for verification.
 */
export const socialLinks: { label: string; href: string; verify?: boolean }[] = [
  { label: "YouTube", href: "https://youtube.com", verify: true },
  { label: "Facebook", href: "https://www.facebook.com", verify: true },
  { label: "TikTok", href: "https://www.tiktok.com", verify: true },
];
