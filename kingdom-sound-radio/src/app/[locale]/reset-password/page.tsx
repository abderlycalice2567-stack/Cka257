import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale, sp } from "@/lib/page";
import { formMessages } from "@/lib/form-messages";
import { ActionForm, Field, Submit } from "@/components/forms/action-form";
import { resetPassword } from "../actions";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const token = sp((await searchParams).token) ?? "";
  return (
    <div className="container flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">{t.auth.resetTitle}</h1>
        {token ? (
          <div className="mt-6">
            <ActionForm action={resetPassword} messages={formMessages(t, t.auth.resetDone)} hideOnSuccess>
              <input type="hidden" name="token" value={token} />
              <Field name="password" label={t.forms.password} type="password" required autoComplete="new-password" hint={t.forms.passwordHint} />
              <Submit label={t.common.submit} pending={t.common.sending} />
            </ActionForm>
            <Link href={`/${locale}/sign-in`} className="mt-4 inline-block text-sm link">{t.nav.signIn}</Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">{t.auth.tokenInvalid}</p>
        )}
      </div>
    </div>
  );
}
