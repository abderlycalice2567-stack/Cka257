import type { Metadata } from "next";
import Link from "next/link";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { formatDate } from "@/lib/i18n";
import { featuredTestimonies, publicPrayerWall } from "@/modules/content";
import { PageHeader } from "@/components/ui/blocks";
import * as I from "@/components/icons";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/community", t.pages.communityTitle, t.pages.communityIntro);
}

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  const L = (p: string) => `/${locale}${p}`;
  const [wall, testimonies] = await Promise.all([publicPrayerWall(6), featuredTestimonies(4)]);
  const tiles = [
    { href: L("/prayer"), title: t.nav.prayer, body: t.forms.prayerPrivacy, icon: I.Heart },
    { href: L("/testimonies"), title: t.nav.testimonies, body: t.forms.testimonyTitle, icon: I.Check },
    { href: L("/devotionals"), title: t.nav.devotionals, body: t.home.verse, icon: I.Calendar },
    { href: L("/events"), title: t.nav.events, body: t.home.events, icon: I.Calendar },
    { href: L("/news"), title: t.nav.news, body: t.home.news, icon: I.List },
    { href: L("/contact"), title: t.nav.contact, body: t.pages.contactTitle, icon: I.User },
  ];
  return (
    <>
      <PageHeader eyebrow={t.nav.community} title={t.pages.communityTitle} intro={t.pages.communityIntro} />
      <div className="container py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map(({ href, title, body, icon: Icon }) => (
            <Link key={href} href={href} className="card flex gap-4 p-6 hover:shadow-lift">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-accent"><Icon /></span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-muted">{body}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-xl font-semibold">{t.nav.prayer}</h2>
            {wall.length ? (
              <ul className="space-y-3">
                {wall.map((p) => (
                  <li key={p.id} className="card p-4 text-sm">
                    <p>{p.body}</p>
                    <p className="mt-2 text-xs text-muted">{p.name ?? "—"} · {formatDate(p.created_at, locale, { dateStyle: "medium" })}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">{t.common.none}</p>}
          </section>
          <section>
            <h2 className="mb-4 text-xl font-semibold">{t.nav.testimonies}</h2>
            {testimonies.length ? (
              <ul className="space-y-3">
                {testimonies.map((x) => (
                  <li key={x.id} className="card p-4 text-sm">
                    <p>“{x.body}”</p>
                    <p className="mt-2 text-xs text-muted">— {x.name}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">{t.common.none}</p>}
          </section>
        </div>
      </div>
    </>
  );
}
