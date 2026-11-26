import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { business } from "@/config/business";
import { isPreview, siteUrl } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PreviewBanner } from "@/components/PreviewBanner";
import { StickyActions } from "@/components/StickyActions";
import { StructuredData } from "@/components/StructuredData";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${business.name} | Auto Repair in ${business.region}`,
    template: `%s | ${business.name}`,
  },
  description:
    "Diagnostics, general repairs and preventive maintenance. Tell us about your vehicle and start with a simple service request.",
  robots: isPreview ? { index: false, follow: false, nocache: true } : { index: true, follow: true },
  openGraph: { type: "website", siteName: business.name, locale: "en_US" },
};

export const viewport: Viewport = { themeColor: "#17324D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen flex-col pb-[72px] md:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-navy"
        >
          Skip to main content
        </a>
        {isPreview && <PreviewBanner />}
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <StickyActions />
        <StructuredData />
      </body>
    </html>
  );
}
