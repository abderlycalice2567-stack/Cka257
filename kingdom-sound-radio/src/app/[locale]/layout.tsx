import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Inter, Sora } from "next/font/google";
import "../globals.css";
import { resolveLocale } from "@/lib/page";
import { localeTags } from "@/lib/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { getStreams } from "@/modules/content";
import { env } from "@/lib/env";
import { PlayerProvider } from "@/components/player/player-provider";
import { PlayerBar } from "@/components/player/player-bar";
import { ListenLiveButton, LiveIndicator } from "@/components/player/controls";
import { BottomNav, LocaleSwitcher, MobileMenu, NavLink, ThemeToggle } from "@/components/site/client-controls";
import { Logo } from "@/components/site/logo";
import { Footer } from "@/components/site/footer";
import * as I from "@/components/icons";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1120" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return {
    metadataBase: new URL(env.appUrl),
    title: { default: `The Kingdom Sound Radio — ${t.meta.tagline}`, template: "%s · The Kingdom Sound Radio" },
    description: t.meta.description,
    manifest: "/manifest.webmanifest",
    robots: env.allowIndexing ? undefined : { index: false, follow: false },
    icons: { icon: [{ url: "/brand/emblem-64.png", sizes: "64x64", type: "image/png" }, { url: "/brand/emblem-192.png", sizes: "192x192", type: "image/png" }], apple: "/brand/apple-touch-icon.png" },
    openGraph: { images: [{ url: "/brand/og-image.jpg", width: 1200, height: 630, alt: "The Kingdom Sound Radio" }] },
    twitter: { card: "summary_large_image", images: ["/brand/og-image.jpg"] },
  };
}

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('ksr_theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})();`;
const SW_SCRIPT = `if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`;

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const [user, streams] = await Promise.all([getCurrentUser(), getStreams()]);
  const L = (p: string) => `/${locale}${p}`;

  const primary = [
    { href: L("/live"), label: t.nav.live },
    { href: L("/programs"), label: t.nav.programs },
    { href: L("/schedule"), label: t.nav.schedule },
    { href: L("/podcasts"), label: t.nav.podcasts },
    { href: L("/community"), label: t.nav.community },
    { href: L("/about"), label: t.nav.about },
  ];
  const mobileItems = [
    { href: L(""), label: t.nav.home },
    ...primary,
    { href: L("/presenters"), label: t.nav.presenters },
    { href: L("/news"), label: t.nav.news },
    { href: L("/devotionals"), label: t.nav.devotionals },
    { href: L("/events"), label: t.nav.events },
    { href: L("/support"), label: t.nav.support },
    { href: L("/contact"), label: t.nav.contact },
    { href: L("/search"), label: t.nav.search },
    user ? { href: L("/account"), label: t.nav.account } : { href: L("/sign-in"), label: t.nav.signIn },
  ];

  return (
    <html lang={localeTags[locale]} className={`${sora.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh pb-[calc(140px+env(safe-area-inset-bottom))] md:pb-24">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-navy">
          {t.nav.skip}
        </a>
        <PlayerProvider streams={streams.map((s) => ({ id: s.id, label: s.label, url: s.url, bitrate_kbps: s.bitrate_kbps }))} locale={locale} signedIn={!!user}>
          <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur">
            <div className="container flex h-16 items-center gap-3">
              <Link href={L("")} className="shrink-0" aria-label="The Kingdom Sound Radio — home">
                <Logo />
              </Link>
              <nav className="ml-4 hidden items-center lg:flex" aria-label="Main">
                {primary.map((it) => (
                  <NavLink key={it.href} href={it.href}>{it.label}</NavLink>
                ))}
              </nav>
              <div className="ml-auto flex items-center gap-1">
                <LiveIndicator liveLabel={t.live.status.live} onAirLabel={t.live.onAirNow} />
                <Link href={L("/search")} className="btn-ghost hidden h-10 w-10 !p-0 sm:inline-flex" aria-label={t.nav.search}>
                  <I.Search />
                </Link>
                <LocaleSwitcher locale={locale} label={t.nav.language} />
                <ThemeToggle labels={{ theme: t.nav.theme, light: t.nav.light, dark: t.nav.dark }} />
                <Link href={user ? L("/account") : L("/sign-in")} className="btn-ghost hidden h-10 w-10 !p-0 sm:inline-flex" aria-label={user ? t.nav.account : t.nav.signIn}>
                  <I.User />
                </Link>
                {user?.isStaff && (
                  <Link href="/admin" className="btn-outline btn-sm hidden xl:inline-flex">{t.nav.admin}</Link>
                )}
                <ListenLiveButton label={t.common.listenLive} stopLabel={t.live.stop} className="btn-live btn-sm ml-1 hidden sm:inline-flex" />
                <MobileMenu items={mobileItems} labels={{ menu: t.nav.menu, close: t.nav.close }} />
              </div>
            </div>
          </header>
          <main id="main">{children}</main>
          <Footer locale={locale} t={t} />
          <PlayerBar
            locale={locale}
            t={{ ...t.live, listenLive: t.common.listenLive, share: t.common.share, copied: t.common.copied, chapters: t.common.chapters }}
          />
          <BottomNav
            items={[
              { href: L(""), label: t.nav.home, icon: "home", exact: true },
              { href: L("/live"), label: t.nav.live.split(" ")[0] ?? t.nav.live, icon: "live" },
              { href: L("/schedule"), label: t.nav.schedule, icon: "schedule" },
              { href: L("/podcasts"), label: t.nav.replay, icon: "replay" },
              { href: user ? L("/account") : L("/sign-in"), label: t.nav.profile, icon: "profile" },
            ]}
          />
        </PlayerProvider>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: SW_SCRIPT }} />
      </body>
    </html>
  );
}
