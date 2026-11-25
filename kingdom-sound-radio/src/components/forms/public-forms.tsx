import Link from "next/link";
import { ActionForm, Checkbox, Field, Submit } from "./action-form";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { formMessages } from "@/lib/form-messages";
import {
  registerForEvent,
  startCheckout,
  submitContact,
  submitPrayer,
  submitSponsorship,
  submitTestimony,
  subscribeNewsletter,
} from "@/app/[locale]/actions";

type P = { locale: Locale; t: Dictionary };

const Consent = ({ locale, t }: P) => (
  <Checkbox
    name="consent"
    required
    label={
      <>
        {t.forms.consent.replace(/\.$/, "")} (<Link className="link" href={`/${locale}/privacy`}>{t.nav.privacy}</Link>).
      </>
    }
  />
);

export function NewsletterForm({ locale, t, compact }: P & { compact?: boolean }) {
  return (
    <ActionForm action={subscribeNewsletter} messages={formMessages(t, t.forms.subscribed)} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <div className={compact ? "flex gap-2" : "grid gap-3 sm:grid-cols-[1fr_auto]"}>
        <label className="sr-only" htmlFor={`nl-${compact ? "c" : "f"}`}>{t.forms.email}</label>
        <input id={`nl-${compact ? "c" : "f"}`} name="email" type="email" required autoComplete="email" placeholder={t.forms.email} className="input" />
        <Submit label={t.forms.subscribe} pending={t.common.sending} className="btn-gold shrink-0" />
      </div>
      <Checkbox name="consent_marketing" required label={t.forms.marketing} />
    </ActionForm>
  );
}

export function ContactForm({ locale, t }: P) {
  return (
    <ActionForm action={submitContact} messages={formMessages(t, t.forms.thanks)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t.forms.name} required autoComplete="name" />
        <Field name="email" label={t.forms.email} type="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="f-topic" className="label">{t.forms.topic}</label>
        <select id="f-topic" name="topic" className="input" defaultValue="general">
          <option value="general">General</option>
          <option value="programs">{t.nav.programs}</option>
          <option value="technical">Technical / listening help</option>
          <option value="partnership">{t.support.sponsorTitle}</option>
          <option value="pastoral">Pastoral care (confidential)</option>
        </select>
      </div>
      <Field name="body" label={t.forms.message} required textarea maxLength={4000} />
      <Consent locale={locale} t={t} />
      <Submit label={t.common.submit} pending={t.common.sending} />
    </ActionForm>
  );
}

export function PrayerForm({ locale, t }: P) {
  return (
    <ActionForm action={submitPrayer} messages={formMessages(t, t.forms.prayerThanks)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t.forms.name} required autoComplete="given-name" />
        <Field name="email" label={`${t.forms.email} (${t.common.optional})`} type="email" autoComplete="email" />
      </div>
      <Field name="body" label={t.forms.prayerBody} required textarea maxLength={3000} />
      <fieldset>
        <legend className="label">{t.forms.prayerVisibility}</legend>
        <div className="space-y-2 text-sm">
          {(
            [
              ["private", t.forms.prayerPrivate],
              ["public_anonymous", t.forms.prayerAnon],
              ["public_named", t.forms.prayerNamed],
            ] as const
          ).map(([v, label], i) => (
            <label key={v} className="flex items-center gap-2.5">
              <input type="radio" name="visibility" value={v} defaultChecked={i === 0} className="h-4 w-4 accent-[#D4AF37]" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-muted">{t.forms.prayerPrivacy}</p>
      <Consent locale={locale} t={t} />
      <Submit label={t.common.submit} pending={t.common.sending} />
    </ActionForm>
  );
}

export function TestimonyForm({ locale, t }: P) {
  return (
    <ActionForm action={submitTestimony} messages={formMessages(t, t.forms.testimonyThanks)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t.forms.name} required autoComplete="name" />
        <Field name="email" label={`${t.forms.email} (${t.common.optional})`} type="email" autoComplete="email" />
      </div>
      <Field name="body" label={t.forms.message} required textarea rows={7} maxLength={5000} />
      <Checkbox name="consent_publish" label={t.forms.testimonyConsent} />
      <Consent locale={locale} t={t} />
      <Submit label={t.common.submit} pending={t.common.sending} />
    </ActionForm>
  );
}

export function SponsorshipForm({ t }: P) {
  return (
    <ActionForm action={submitSponsorship} messages={formMessages(t, t.support.sponsorThanks)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label={t.forms.name} required autoComplete="name" />
        <Field name="organization" label={t.forms.organization} required autoComplete="organization" />
      </div>
      <Field name="email" label={t.forms.email} type="email" required autoComplete="email" />
      <Field name="message" label={t.forms.message} required textarea maxLength={4000} />
      <Submit label={t.common.submit} pending={t.common.sending} />
    </ActionForm>
  );
}

export function EventRegistrationForm({ t, eventId }: P & { eventId: string }) {
  return (
    <ActionForm action={registerForEvent} messages={formMessages(t, t.forms.registered)} hideOnSuccess className="space-y-3">
      <input type="hidden" name="event_id" value={eventId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="name" label={t.forms.name} required autoComplete="name" />
        <Field name="email" label={t.forms.email} type="email" required autoComplete="email" />
      </div>
      <Submit label={t.forms.register} pending={t.common.sending} className="btn-gold btn-sm" />
    </ActionForm>
  );
}

export function DonationForm({ locale, t, campaigns, connected }: P & { campaigns: { id: string; title: string }[]; connected: boolean }) {
  if (!connected) {
    return <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">{t.support.notConnected}</p>;
  }
  return (
    <ActionForm action={startCheckout} messages={formMessages(t, "")} resetOnSuccess={false}>
      <input type="hidden" name="locale" value={locale} />
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="sr-only">{t.support.give}</legend>
        <label className="card flex cursor-pointer items-center gap-2 p-3 text-sm has-[:checked]:border-accent">
          <input type="radio" name="recurring" value="false" defaultChecked className="accent-[#D4AF37]" /> {t.support.oneTime}
        </label>
        <label className="card flex cursor-pointer items-center gap-2 p-3 text-sm has-[:checked]:border-accent">
          <input type="radio" name="recurring" value="true" className="accent-[#D4AF37]" /> {t.support.monthly}
        </label>
      </fieldset>
      <Field name="amount" label={t.support.amount} type="number" required defaultValue="25" />
      {campaigns.length > 0 && (
        <div>
          <label className="label" htmlFor="f-campaign">{t.common.category}</label>
          <select id="f-campaign" name="campaign_id" className="input" defaultValue="">
            <option value="">—</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}
      <Submit label={t.support.checkout} pending={t.common.sending} />
      <p className="text-xs text-muted">{t.support.taxNote}</p>
    </ActionForm>
  );
}
