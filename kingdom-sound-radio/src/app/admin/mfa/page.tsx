import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { Flash } from "@/components/admin/ui";
import { verifyMfa } from "../actions";

export const metadata = { title: "Two-step verification" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await getCurrentUser();
  if (!u) redirect("/en/sign-in?next=/admin");
  if (!hasPermission(u.permissions, "admin.access")) redirect("/admin/forbidden");
  if (!u.totpEnabled) redirect("/admin/mfa/setup");
  if (u.mfaVerified) redirect("/admin");
  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Two-step verification</h1>
        <p className="mt-2 text-sm text-muted">Enter the 6-digit code from your authenticator app to open the administration area.</p>
        <div className="mt-6"><Flash sp={await searchParams} /></div>
        <form action={verifyMfa} className="space-y-4">
          <label className="block">
            <span className="label">Authentication code</span>
            <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus className="input text-center font-mono text-2xl tracking-[0.5em]" />
          </label>
          <button className="btn-gold w-full" type="submit">Verify</button>
        </form>
        <p className="mt-6 text-xs text-muted">Lost your device? Ask a Super Administrator to reset your two-step verification.</p>
      </div>
    </div>
  );
}
