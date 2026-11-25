import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { decryptSecret, otpauthUrl } from "@/lib/auth/totp";
import { Flash } from "@/components/admin/ui";
import { beginMfaSetup, confirmMfaSetup } from "../../actions";

export const metadata = { title: "Set up two-step verification" };

export default async function MfaSetupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await getCurrentUser();
  if (!u) redirect("/en/sign-in?next=/admin");
  if (!hasPermission(u.permissions, "admin.access")) redirect("/admin/forbidden");
  if (u.totpEnabled) redirect(u.mfaVerified ? "/admin" : "/admin/mfa");
  const sp = await searchParams;
  const [row] = await sql<{ totp_secret_enc: string | null }[]>`SELECT totp_secret_enc FROM users WHERE id = ${u.id}`;
  const secret = sp.step === "scan" && row?.totp_secret_enc ? decryptSecret(row.totp_secret_enc) : null;
  const grouped = secret?.match(/.{1,4}/g)?.join(" ");

  return (
    <div className="mx-auto mt-10 max-w-lg">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Set up two-step verification</h1>
        <p className="mt-2 text-sm text-muted">
          Administrator accounts must use an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy…). This protects the station if a password is ever leaked.
        </p>
        <div className="mt-6"><Flash sp={sp} /></div>
        {!secret ? (
          <form action={beginMfaSetup}>
            <button className="btn-gold" type="submit">Generate my setup key</button>
          </form>
        ) : (
          <div className="space-y-5">
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Open your authenticator app and choose <strong>Add account → Enter a setup key</strong> (time-based).</li>
              <li>Account name: <strong>{u.email}</strong></li>
              <li>Key:</li>
            </ol>
            <p className="select-all rounded-xl bg-surface-2 px-4 py-3 text-center font-mono text-lg tracking-wider">{grouped}</p>
            <p className="text-xs text-muted">
              On this phone? <a className="link" href={otpauthUrl(secret, u.email)}>Open in authenticator app</a>
            </p>
            <form action={confirmMfaSetup} className="space-y-3">
              <label className="block">
                <span className="label">Enter the 6-digit code the app shows</span>
                <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required className="input text-center font-mono text-2xl tracking-[0.5em]" />
              </label>
              <button className="btn-gold w-full" type="submit">Confirm and continue</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
