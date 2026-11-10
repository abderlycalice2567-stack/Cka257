import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DemoBanner } from "@/components/layout/demo-banner";
import { PlayerProvider } from "@/components/player/player-context";
import { PlayerBar } from "@/components/player/player-bar";

// Self-hosted at build time (no runtime third-party font requests — F-05).
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});
const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const allowIndex = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Jona Radio — Proposition de refonte (démo)",
    template: "%s · Jona Radio (démo)",
  },
  description: site.description,
  applicationName: "Jona Radio (maquette)",
  robots: allowIndex
    ? undefined
    : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Jona Radio — Proposition de refonte (démo)",
    description: site.description,
    siteName: "Jona Radio (maquette)",
  },
};

export const viewport: Viewport = {
  themeColor: "#101B33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the per-request nonce opts rendering into dynamic mode so Next's
  // own scripts carry the same nonce as the CSP set in middleware (F-01).
  void headers();

  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen pb-20">
        <a href="#main" className="skip-link">
          Aller au contenu principal
        </a>
        <PlayerProvider streamUrl={site.stream.url} metadataUrl={site.stream.metadataUrl}>
          <DemoBanner />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
