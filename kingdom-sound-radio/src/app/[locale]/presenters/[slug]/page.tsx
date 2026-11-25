import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizedMeta, resolveLocale } from "@/lib/page";
import { pick, isLocale } from "@/lib/i18n/config";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { getPresenter, mediaUrl, programsForPresenter } from "@/modules/catalog";
import { userSets } from "@/modules/account";
import { Avatar } from "@/components/ui/art";
import { ProgramCard, SampleBadge } from "@/components/ui/blocks";
import { FollowButton } from "@/components/site/engagement";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const p = await getPresenter(slug);
  return p ? localizedMeta(locale, `/presenters/${slug}`, p.display_name, pick(p.bio, locale).slice(0, 160)) : {};
}

export default async function PresenterPage({ params }: { params: Params }) {
  const { locale, t } = await resolveLocale(params);
  const { slug } = await params;
  const p = await getPresenter(slug);
  if (!p) notFound();
  const [programs, user] = await Promise.all([programsForPresenter(p.id), getCurrentUser()]);
  const sets = await userSets(user?.id);
  const jsonLd = { "@context": "https://schema.org", "@type": "Person", name: p.display_name, jobTitle: pick(p.title, locale), url: `${env.appUrl}/${locale}/presenters/${slug}`, worksFor: { "@type": "RadioStation", name: "The Kingdom Sound Radio" } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="border-b border-line bg-navy text-ivory">
        <div className="container flex flex-col gap-6 py-12 sm:flex-row sm:items-center">
          <Avatar name={p.display_name} src={mediaUrl(p.photo_key)} size={128} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{pick(p.title, locale)}</p>
            <h1 className="mt-2 text-3xl font-bold md:text-5xl">{p.display_name}</h1>
            {p.is_sample && <div className="mt-3"><SampleBadge label={t.common.sample} /></div>}
            <div className="mt-5 [&_.btn-outline]:border-ivory/25 [&_.btn-outline]:bg-transparent [&_.btn-outline]:text-ivory">
              <FollowButton targetType="presenter" targetId={p.id} active={sets.follows.has(p.id)} signedIn={!!user} locale={locale} labels={{ follow: t.common.follow, following: t.common.following, signIn: t.common.follow }} />
            </div>
          </div>
        </div>
      </section>
      <div className="container py-10">
        <p className="max-w-3xl whitespace-pre-line text-[15px] leading-7">{pick(p.bio, locale)}</p>
        {programs.length > 0 && (
          <>
            <h2 className="mb-4 mt-10 text-2xl font-semibold">{t.nav.programs}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((pr) => <ProgramCard key={pr.id} p={pr} locale={locale} t={t} />)}
            </div>
          </>
        )}
      </div>
    </>
  );
}
