import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { pick } from "@/lib/i18n/config";
import { getStation, visiblePlatforms } from "@/modules/content";
import { Logo } from "./logo";
import { NewsletterForm } from "@/components/forms/public-forms";
import * as I from "@/components/icons";

export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [station, platforms] = await Promise.all([getStation(), visiblePlatforms()]);
  const L = (p: string) => `/${locale}${p}`;
  const cols = [
    { title: t.nav.live, links: [[L("/live"), t.nav.live], [L("/schedule"), t.nav.schedule], [L("/programs"), t.nav.programs], [L("/podcasts"), t.nav.podcasts], [L("/presenters"), t.nav.presenters]] },
    { title: t.nav.community, links: [[L("/community"), t.nav.community], [L("/prayer"), t.nav.prayer], [L("/testimonies"), t.nav.testimonies], [L("/devotionals"), t.nav.devotionals], [L("/events"), t.nav.events], [L("/news"), t.nav.news]] },
    { title: t.nav.about, links: [[L("/about"), t.nav.about], [L("/mission"), t.nav.mission], [L("/leadership"), t.nav.leadership], [L("/support"), t.nav.support], [L("/contact"), t.nav.contact], [L("/faq"), t.nav.faq]] },
  ];
  const social = platforms.filter((p) => p.kind === "social");
  const listen = platforms.filter((p) => p.kind !== "social");
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted">{pick(station.tagline, locale) || t.meta.tagline}</p>
          <div>
            <p className="mb-2 text-sm font-semibold">{t.home.newsletterTitle}</p>
            <NewsletterForm locale={locale} t={t} compact />
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-sm font-semibold">{c.title}</p>
            <ul className="space-y-2 text-sm text-muted">
              {c.links.map(([href, label]) => (
                <li key={href}><Link href={href!} className="hover:text-accent">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {(listen.length > 0 || social.length > 0) && (
        <div className="container flex flex-wrap gap-2 border-t border-line py-5">
          {[...listen, ...social].map((p) => (
            <a key={p.key} href={p.url!} rel="noopener noreferrer" target="_blank" className="chip hover:border-accent hover:text-fg">
              {p.name} <I.External size={12} />
            </a>
          ))}
        </div>
      )}
      <div className="container flex flex-col gap-3 border-t border-line py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {station.name}</p>
        <ul className="flex flex-wrap gap-4">
          <li><Link href={L("/privacy")} className="hover:text-accent">{t.nav.privacy}</Link></li>
          <li><Link href={L("/terms")} className="hover:text-accent">{t.nav.terms}</Link></li>
          <li><Link href={L("/accessibility")} className="hover:text-accent">{t.nav.accessibility}</Link></li>
          <li><a href="/feeds/podcasts.xml" className="inline-flex items-center gap-1 hover:text-accent"><I.Rss size={12} /> RSS</a></li>
        </ul>
      </div>
    </footer>
  );
}
