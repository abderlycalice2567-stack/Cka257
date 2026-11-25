import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale, sp } from "@/lib/page";
import { formatDate, formatDuration } from "@/lib/i18n";
import { intlTags, localeNames, locales, pick } from "@/lib/i18n/config";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { formMessages } from "@/lib/form-messages";
import { dashboard } from "@/modules/account";
import { getStation } from "@/modules/content";
import { toEpisodeItem } from "@/lib/episode-item";
import { EmptyState, EpisodeCard } from "@/components/ui/blocks";
import { PlayEpisodeButton } from "@/components/player/controls";
import { LocalTime } from "@/components/ui/local-time";
import { ActionForm, Checkbox, Field, Submit } from "@/components/forms/action-form";
import { deleteAccount, resendVerification, signOut, updateNotifications, updateSettings } from "../actions";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const user = await requireUser(locale);
  const welcome = sp((await searchParams).welcome) === "1";
  const [d, station] = await Promise.all([dashboard(user.id), getStation()]);
  const L = (p: string) => `/${locale}${p}`;

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.account.membership}: {t.account.membershipBody}</p>
          <h1 className="mt-2 text-3xl font-bold">{t.account.title}</h1>
          <p className="mt-1 text-muted">{user.displayName} · {user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.isStaff && <Link href="/admin" className="btn-outline btn-sm">{t.nav.admin}</Link>}
          <form action={signOut}>
            <input type="hidden" name="locale" value={locale} />
            <button className="btn-outline btn-sm" type="submit">{t.nav.signOut}</button>
          </form>
        </div>
      </div>

      {(welcome || !user.emailVerified) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4 text-sm">
          <span>{t.auth.verifyPending}{!env.emailConfigured && " (Development: the verification link is written to the server log.)"}</span>
          {!user.emailVerified && (
            <form action={resendVerification}>
              <button className="btn-outline btn-sm" type="submit">{t.auth.resend}</button>
            </form>
          )}
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">{t.account.continue}</h2>
        {d.continueListening.length ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {d.continueListening.map((e) => {
              const item = toEpisodeItem(e, locale);
              const pct = e.duration_seconds ? Math.min(100, (e.position_seconds / e.duration_seconds) * 100) : 0;
              return (
                <li key={e.id} className="card p-4">
                  <p className="text-xs text-accent">{pick(e.program_title, locale)}</p>
                  <Link href={L(`/programs/${e.program_slug}/${e.slug}`)} className="font-semibold hover:text-accent">{e.title}</Link>
                  <div className="mt-3 h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} /></div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>{formatDuration(e.position_seconds)} / {formatDuration(e.duration_seconds)}</span>
                    {item && <PlayEpisodeButton episode={item} label={t.live.resume} pauseLabel={t.common.pause} className="btn-gold btn-sm" startAt={e.position_seconds} />}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState>{t.account.empty} <Link className="link" href={L("/podcasts")}>{t.nav.podcasts}</Link></EmptyState>}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">{t.account.favorites}</h2>
        {d.favorites.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{d.favorites.map((e) => <EpisodeCard key={e.id} e={e} locale={locale} t={t} />)}</div>
        ) : <EmptyState>{t.account.empty}</EmptyState>}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">{t.account.followedPrograms}</h2>
          {d.programs.length ? (
            <ul className="space-y-1.5 text-sm">{d.programs.map((p) => <li key={p.id}><Link className="link" href={L(`/programs/${p.slug}`)}>{pick(p.title, locale)}</Link></li>)}</ul>
          ) : <p className="text-sm text-muted">{t.account.empty}</p>}
          <h2 className="mb-3 mt-6 font-semibold">{t.account.followedPresenters}</h2>
          {d.presenters.length ? (
            <ul className="space-y-1.5 text-sm">{d.presenters.map((p) => <li key={p.id}><Link className="link" href={L(`/presenters/${p.slug}`)}>{p.display_name}</Link></li>)}</ul>
          ) : <p className="text-sm text-muted">{t.account.empty}</p>}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">{t.account.upcoming}</h2>
          {d.upcoming.length ? (
            <ul className="space-y-2 text-sm">
              {d.upcoming.map((o, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <Link className="link" href={L(`/programs/${o.program_slug}`)}>{pick(o.program_title, locale)}</Link>
                  <span className="whitespace-nowrap text-muted"><LocalTime iso={o.starts_at.toISOString()} stationTz={station.timezone} intl={intlTags[locale]} options={{ weekday: "short", hour: "numeric", minute: "2-digit" }} /></span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{t.account.empty}</p>}
          <h2 className="mb-3 mt-6 font-semibold">{t.account.reminders}</h2>
          {d.reminders.length ? (
            <ul className="space-y-1.5 text-sm">{d.reminders.map((p) => <li key={p.id}><Link className="link" href={L(`/programs/${p.slug}`)}>{pick(p.title, locale)}</Link></li>)}</ul>
          ) : <p className="text-sm text-muted">{t.account.empty}</p>}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">{t.account.history}</h2>
          {d.history.length ? (
            <ul className="space-y-2 text-sm">
              {d.history.map((h, i) => (
                <li key={i} className="flex justify-between gap-2">
                  {h.kind === "live" ? <span>{t.account.live}</span> : <Link className="link truncate" href={L(`/programs/${h.program_slug}/${h.slug}`)}>{h.title}</Link>}
                  <span className="whitespace-nowrap text-xs text-muted">{formatDate(h.started_at, locale, { dateStyle: "short" })}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{t.account.empty}</p>}
        </section>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t.account.settings}</h2>
          <ActionForm action={updateSettings} messages={formMessages(t, t.account.saved)} resetOnSuccess={false}>
            <Field name="display_name" label={t.account.displayName} required defaultValue={user.displayName} />
            <div>
              <label className="label" htmlFor="f-locale">{t.account.preferredLanguage}</label>
              <select id="f-locale" name="locale" defaultValue={user.locale} className="input">
                {locales.map((l) => <option key={l} value={l}>{localeNames[l]}</option>)}
              </select>
            </div>
            <Submit label={t.common.save} pending={t.common.sending} />
          </ActionForm>
        </section>
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t.account.notifications}</h2>
          <ActionForm action={updateNotifications} messages={formMessages(t, t.account.saved)} resetOnSuccess={false}>
            <Checkbox name="email_program_updates" defaultChecked={d.prefs.email_program_updates} label={t.account.notifProgram} />
            <Checkbox name="email_reminders" defaultChecked={d.prefs.email_reminders} label={t.account.notifReminder} />
            <Checkbox name="email_marketing" defaultChecked={d.prefs.email_marketing} label={t.account.notifMarketing} />
            {!env.emailConfigured && <p className="text-xs text-muted">{t.account.emailNotConfigured}</p>}
            <Submit label={t.common.save} pending={t.common.sending} />
          </ActionForm>
        </section>
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t.account.donations}</h2>
          {d.donations.length ? (
            <ul className="space-y-2 text-sm">
              {d.donations.map((x, i) => (
                <li key={i} className="flex justify-between">
                  <span>{(x.amount_cents / 100).toLocaleString(intlTags[locale], { style: "currency", currency: x.currency.toUpperCase() })}{x.recurring ? " / mo" : ""}</span>
                  <span className="text-muted">{x.status} · {formatDate(x.created_at, locale, { dateStyle: "medium" })}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{t.account.empty}</p>}
        </section>
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t.account.privacy}</h2>
          <a href="/api/v1/account/export" download className="btn-outline btn-sm">{t.account.exportData}</a>
          {!user.isStaff && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-live">{t.account.deleteAccount}</summary>
              <p className="mt-2 text-sm text-muted">{t.account.deleteWarning}</p>
              <div className="mt-3">
                <ActionForm action={deleteAccount} messages={formMessages(t, "")} resetOnSuccess={false}>
                  <Field name="confirm" label={t.account.deleteConfirm} required />
                  <Submit label={t.account.deleteAccount} pending={t.common.sending} className="btn-live" />
                </ActionForm>
              </div>
            </details>
          )}
        </section>
      </div>
    </div>
  );
}
