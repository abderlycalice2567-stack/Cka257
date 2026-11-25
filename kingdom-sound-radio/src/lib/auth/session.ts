import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { hashToken, newToken } from "./tokens";
import { hasPermission, type Permission } from "./permissions";

export const SESSION_COOKIE = "ksr_session";
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  locale: "en" | "fr" | "ht";
  emailVerified: boolean;
  roles: string[];
  permissions: Set<string>;
  isStaff: boolean;
  totpEnabled: boolean;
  mfaVerified: boolean;
  sessionId: string;
};

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

export async function createSession(userId: string) {
  const token = newToken();
  const h = await headers();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await sql`INSERT INTO sessions (id, user_id, expires_at, ip, user_agent)
            VALUES (${hashToken(token)}, ${userId}, ${expires}, ${await clientIp()}, ${h.get("user-agent")?.slice(0, 300) ?? null})`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql`DELETE FROM sessions WHERE id = ${hashToken(token)}`;
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
}

/** Resolves the signed-in user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await sql<
    { id: string; email: string; display_name: string; locale: "en" | "fr" | "ht"; email_verified_at: Date | null; roles: string[] | null; perms: string[] | null; is_staff: boolean | null; totp_enabled_at: Date | null; mfa_verified_at: Date | null; sid: string }[]
  >`
    SELECT u.id, u.email, u.display_name, u.locale, u.email_verified_at, u.totp_enabled_at, s.mfa_verified_at, s.id AS sid,
           array_agg(DISTINCT ur.role_key) FILTER (WHERE ur.role_key IS NOT NULL) AS roles,
           array_agg(DISTINCT rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL) AS perms,
           bool_or(r.is_staff) AS is_staff
      FROM sessions s
      JOIN users u ON u.id = s.user_id AND u.status = 'active'
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.key = ur.role_key
      LEFT JOIN role_permissions rp ON rp.role_key = ur.role_key
     WHERE s.id = ${hashToken(token)} AND s.expires_at > now()
     GROUP BY u.id, s.id`;
  const u = rows[0];
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    locale: u.locale,
    emailVerified: !!u.email_verified_at,
    roles: u.roles ?? [],
    permissions: new Set(u.perms ?? []),
    isStaff: !!u.is_staff,
    totpEnabled: !!u.totp_enabled_at,
    mfaVerified: !!u.mfa_verified_at,
    sessionId: u.sid,
  };
});

export async function requireUser(locale = "en"): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect(`/${locale}/sign-in`);
  return u;
}

/** Staff must complete TOTP for this session before any admin page or action runs. */
export function mfaRequired() {
  // The opt-out exists only for local development; production always enforces MFA.
  return process.env.NODE_ENV === "production" || process.env.ADMIN_MFA_REQUIRED !== "false";
}

/** True when this session may see staff-only data (admin role + MFA done). */
export function isAdminSession(u: CurrentUser | null) {
  return !!u && hasPermission(u.permissions, "admin.access") && (!mfaRequired() || u.mfaVerified);
}

/** Server-side authorization gate for admin pages and actions. */
export async function requirePermission(p: Permission): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/en/sign-in?next=/admin");
  if (!hasPermission(u.permissions, "admin.access")) redirect("/admin/forbidden");
  if (mfaRequired() && !u.mfaVerified) redirect(u.totpEnabled ? "/admin/mfa" : "/admin/mfa/setup");
  if (!hasPermission(u.permissions, p)) redirect("/admin/forbidden");
  return u;
}

export async function markSessionMfaVerified(sessionId: string) {
  await sql`UPDATE sessions SET mfa_verified_at = now() WHERE id = ${sessionId}`;
}

export function can(u: CurrentUser | null, p: Permission) {
  return !!u && hasPermission(u.permissions, p);
}
