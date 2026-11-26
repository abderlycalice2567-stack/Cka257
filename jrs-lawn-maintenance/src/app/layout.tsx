import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { business } from "@/config/business";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LocalBusinessJsonLd } from "@/components/JsonLd";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { StickyActions } from "@/components/StickyActions";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${business.name} | Lawn Maintenance in Athens, GA`,
    template: `%s | ${business.name}`,
  },
  description: "Request dependable, recurring lawn mowing, edging and routine maintenance.",
  robots: process.env.ALLOW_INDEXING === "true" ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#28543A", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading request headers renders pages per request, so Next can attach the
  // CSP nonce (set in src/proxy.ts) to its scripts.
  await headers();
  return (
    <html lang="en-US">
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only z-50 rounded-card bg-pine px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to main content
        </a>
        <PrototypeBanner />
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <StickyActions />
        <LocalBusinessJsonLd />
      </body>
    </html>
  );
}
