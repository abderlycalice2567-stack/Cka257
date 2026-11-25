import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Inter, Sora } from "next/font/google";
import "../globals.css";
import { getCurrentUser, isAdminSession } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { Logo } from "@/components/site/logo";
import { signOut } from "@/app/[locale]/actions";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = { title: { default: "Admin · The Kingdom Sound Radio", template: "%s · Admin" }, robots: { index: false, follow: false } };

const NAV: { href: string; label: string; perm: Permission }[] = [
  { href: "/admin", label: "Dashboard", perm: "admin.access" },
  { href: "/admin/station", label: "Broadcasting", perm: "station.manage" },
  { href: "/admin/schedule", label: "Schedule", perm: "schedule.manage" },
  { href: "/admin/programs", label: "Programs", perm: "programs.manage" },
  { href: "/admin/episodes", label: "Episodes & media", perm: "episodes.manage" },
  { href: "/admin/presenters", label: "Presenters", perm: "presenters.manage" },
  { href: "/admin/content", label: "Content", perm: "content.manage" },
  { href: "/admin/appearance", label: "Homepage", perm: "content.manage" },
  { href: "/admin/community", label: "Community", perm: "community.moderate" },
  { href: "/admin/community", label: "Prayer requests", perm: "prayer.view_assigned" },
  { href: "/admin/finance", label: "Finance", perm: "finance.view" },
  { href: "/admin/integrations", label: "Integrations", perm: "integrations.manage" },
  { href: "/admin/users", label: "Users & roles", perm: "users.manage" },
  { href: "/admin/audit", label: "Audit log", perm: "audit.view" },
  { href: "/admin/launch", label: "Launch readiness", perm: "admin.access" },
];

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('ksr_theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})();`;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const user = await getCurrentUser();
  const ready = isAdminSession(user);
  const seen = new Set<string>();
  const nav = ready ? NAV.filter((n) => hasPermission(user!.permissions, n.perm) && !seen.has(n.href) && seen.add(n.href)) : [];
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <div className="flex min-h-dvh flex-col md:flex-row">
          <aside className="border-b border-line bg-navy text-ivory md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:overflow-y-auto md:border-b-0">
            <div className="flex items-center justify-between p-4 md:block">
              <Link href="/admin" className="[&_*]:!text-ivory [&_.text-accent]:!text-gold"><Logo /></Link>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold md:mt-2 md:block">Administration</span>
            </div>
            {nav.length > 0 && (
              <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-0.5 md:pb-6">
                {nav.map((n) => (
                  <Link key={n.href + n.label} href={n.href} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ivory/80 hover:bg-ivory/10 hover:text-ivory">
                    {n.label}
                  </Link>
                ))}
              </nav>
            )}
            {user && (
              <div className="hidden border-t border-ivory/10 p-4 text-xs text-ivory/60 md:block">
                <p className="truncate">{user.email}</p>
                <p className="mt-1">{user.roles.join(", ")}</p>
                <div className="mt-3 flex gap-2">
                  <Link href="/en" className="underline">View site</Link>
                  <form action={signOut}><input type="hidden" name="locale" value="en" /><button className="underline" type="submit">Sign out</button></form>
                </div>
              </div>
            )}
          </aside>
          <main className="min-w-0 flex-1 bg-bg p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
