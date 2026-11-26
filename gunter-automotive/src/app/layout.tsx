import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StickyActions } from "@/components/StickyActions";
import { business } from "@/config/business";
import { isLive, pageTitle, siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: pageTitle(), template: `%s | ${business.name}` },
  description: "Request maintenance, diagnostics or repair from Gunter Automotive in Georgia. Start with a simple service request.",
  // Private preview: never indexed until SITE_MODE=live after owner sign-off.
  robots: isLive() ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
  openGraph: { type: "website", siteName: business.name, locale: "en_US" },
};

export const viewport: Viewport = { themeColor: "#19334D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only z-50 rounded-card bg-amber px-4 py-3 font-semibold text-brand-800 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to main content
        </a>
        <DemoBanner />
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <StickyActions />
      </body>
    </html>
  );
}
