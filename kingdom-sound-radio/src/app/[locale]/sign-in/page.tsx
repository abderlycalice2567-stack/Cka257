import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveLocale, sp } from "@/lib/page";
import { getCurrentUser } from "@/lib/auth/session";
import { formMessages } from "@/lib/form-messages";
import { ActionForm, Field, Submit } from "@/components/forms/action-form";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const q = await searchParams;
  const next = sp(q.next) ?? "";
  if (await getCurrentUser()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : `/${locale}/account`);
  return (
    <div className="container flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">{t.auth.signInTitle}</h1>
        {sp(q.reset) === "1" && <p role="status" className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-sm">{t.auth.resetDone}</p>}
        <div className="mt-6">
          <ActionForm action={signIn} messages={formMessages(t, "")} resetOnSuccess={false}>
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="locale" value={locale} />
            <Field name="email" label={t.forms.email} type="email" required autoComplete="email" />
            <Field name="password" label={t.forms.password} type="password" required autoComplete="current-password" />
            <div className="flex items-center justify-between">
              <Submit label={t.auth.signInTitle} pending={t.common.sending} />
              <Link href={`/${locale}/forgot-password`} className="text-sm link">{t.auth.forgot}</Link>
            </div>
          </ActionForm>
        </div>
        <p className="mt-6 text-sm text-muted">
          {t.auth.noAccount} <Link className="link font-semibold text-fg" href={`/${locale}/sign-up`}>{t.auth.createAccount}</Link>
        </p>
      </div>
    </div>
  );
}
