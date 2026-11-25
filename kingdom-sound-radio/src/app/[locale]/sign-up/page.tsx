import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveLocale } from "@/lib/page";
import { getCurrentUser } from "@/lib/auth/session";
import { formMessages } from "@/lib/form-messages";
import { ActionForm, Checkbox, Field, Submit } from "@/components/forms/action-form";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, t } = await resolveLocale(params);
  if (await getCurrentUser()) redirect(`/${locale}/account`);
  return (
    <div className="container flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">{t.auth.signUpTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.auth.signUpBody}</p>
        <div className="mt-6">
          <ActionForm action={signUp} messages={formMessages(t, "")} resetOnSuccess={false}>
            <input type="hidden" name="locale" value={locale} />
            <Field name="display_name" label={t.forms.name} required autoComplete="name" />
            <Field name="email" label={t.forms.email} type="email" required autoComplete="email" />
            <Field name="password" label={t.forms.password} type="password" required autoComplete="new-password" hint={t.forms.passwordHint} />
            <Checkbox
              name="consent"
              required
              label={<>{t.forms.consent.replace(/\.$/, "")} (<Link className="link" href={`/${locale}/privacy`}>{t.nav.privacy}</Link>).</>}
            />
            <Checkbox name="marketing" label={t.forms.marketing} />
            <Submit label={t.auth.createAccount} pending={t.common.sending} />
          </ActionForm>
        </div>
        <p className="mt-6 text-sm text-muted">
          {t.auth.haveAccount} <Link className="link font-semibold text-fg" href={`/${locale}/sign-in`}>{t.nav.signIn}</Link>
        </p>
      </div>
    </div>
  );
}
