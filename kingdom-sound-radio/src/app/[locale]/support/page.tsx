import type { Metadata } from "next";
import { localizedMeta, resolveLocale, sp } from "@/lib/page";
import { pick } from "@/lib/i18n/config";
import { env } from "@/lib/env";
import { activeCampaigns } from "@/modules/content";
import { PageHeader, SampleBadge } from "@/components/ui/blocks";
import { DonationForm, SponsorshipForm } from "@/components/forms/public-forms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return localizedMeta(locale, "/support", t.pages.supportTitle, t.home.supportBody);
}

export default async function SupportPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const status = sp((await searchParams).status);
  const campaigns = await activeCampaigns();
  return (
    <>
      <PageHeader eyebrow={t.nav.support} title={t.pages.supportTitle} intro={t.home.supportBody} />
      <div className="container grid gap-8 py-10 lg:grid-cols-2">
        <section className="card p-6 md:p-8">
          <h2 className="text-xl font-semibold">{t.support.give}</h2>
          {status === "thanks" && <p role="status" className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">{t.support.thanks}</p>}
          {status === "cancelled" && <p role="status" className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm">{t.support.cancelled}</p>}
          <div className="mt-5">
            <DonationForm locale={locale} t={t} connected={env.stripeConfigured} campaigns={campaigns.map((c) => ({ id: c.id, title: pick(c.title, locale) }))} />
          </div>
          {campaigns.length > 0 && (
            <ul className="mt-6 space-y-3">
              {campaigns.map((c) => (
                <li key={c.id} className="rounded-xl bg-surface-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{pick(c.title, locale)}</span>
                    {c.is_sample && <SampleBadge label={t.common.sample} />}
                  </div>
                  {c.goal_cents ? (
                    <div className="mt-2 h-2 rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={c.goal_cents} aria-valuenow={c.raised_cents}>
                      <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (c.raised_cents / c.goal_cents) * 100)}%` }} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section id="sponsor" className="card p-6 md:p-8">
          <h2 className="text-xl font-semibold">{t.support.sponsorTitle}</h2>
          <p className="mt-2 text-sm text-muted">{t.support.sponsorBody}</p>
          <div className="mt-5"><SponsorshipForm locale={locale} t={t} /></div>
        </section>
      </div>
    </>
  );
}
