import type { Metadata } from "next";
import { resolveLocale } from "@/lib/page";
import { formMessages } from "@/lib/form-messages";
import { ActionForm, Field, Submit } from "@/components/forms/action-form";
import { requestReset } from "../actions";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ForgotPage({ params }: { params: Promise<{ locale: string }> }) {
  const { t } = await resolveLocale(params);
  return (
    <div className="container flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">{t.auth.forgotTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.auth.forgotBody}</p>
        <div className="mt-6">
          <ActionForm action={requestReset} messages={formMessages(t, t.auth.forgotSent)} hideOnSuccess>
            <Field name="email" label={t.forms.email} type="email" required autoComplete="email" />
            <Submit label={t.common.submit} pending={t.common.sending} />
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
