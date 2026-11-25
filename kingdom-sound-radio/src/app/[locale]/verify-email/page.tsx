import type { Metadata } from "next";
import Link from "next/link";
import { resolveLocale, sp } from "@/lib/page";
import { sql } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";

export const metadata: Metadata = { title: "Verify email", robots: { index: false }, referrer: "no-referrer" };

export default async function VerifyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await resolveLocale(params);
  const token = sp((await searchParams).token) ?? "";
  let ok = false;
  if (token.length >= 20 && token.length <= 200) {
    const rows = await sql<{ user_id: string }[]>`
      UPDATE email_tokens SET used_at = now()
       WHERE token_hash = ${hashToken(token)} AND purpose = 'verify' AND used_at IS NULL AND expires_at > now()
       RETURNING user_id`;
    if (rows[0]) {
      await sql`UPDATE users SET email_verified_at = now() WHERE id = ${rows[0].user_id} AND email_verified_at IS NULL`;
      ok = true;
    }
  }
  return (
    <div className="container flex justify-center py-16">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold">{t.auth.verifyTitle}</h1>
        <p className="mt-4 text-sm">{ok ? t.auth.verified : t.auth.verifyFailed}</p>
        <Link href={`/${locale}/account`} className="btn-gold mt-6">{t.nav.account}</Link>
      </div>
    </div>
  );
}
