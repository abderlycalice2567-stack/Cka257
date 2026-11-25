"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFavorite, toggleFollow, toggleReminder } from "@/app/[locale]/actions";
import * as I from "@/components/icons";

function SignInLink({ locale, label, compact }: { locale: string; label: string; compact?: boolean }) {
  const path = usePathname();
  return (
    <Link href={`/${locale}/sign-in?next=${encodeURIComponent(path || "/")}`} className={compact ? "btn-ghost h-9 w-9 !p-0" : "btn-outline btn-sm"} title={label} aria-label={label}>
      {compact ? <I.Bell size={18} /> : label}
    </Link>
  );
}

function useToggle(initial: boolean, run: (path: string) => Promise<boolean>) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const path = usePathname() || "/";
  const toggle = () =>
    start(async () => {
      setOn((v) => !v); // optimistic
      try {
        setOn(await run(path));
      } catch {
        setOn((v) => !v);
      }
    });
  return { on, pending, toggle };
}

export function ReminderButton({ programId, active, signedIn, locale, labels, compact }: { programId: string; active: boolean; signedIn: boolean; locale: string; labels: { remind: string; set: string; signIn: string }; compact?: boolean }) {
  const { on, pending, toggle } = useToggle(active, (p) => toggleReminder(programId, p));
  if (!signedIn) return <SignInLink locale={locale} label={labels.signIn} compact={compact} />;
  return (
    <button type="button" onClick={toggle} disabled={pending} aria-pressed={on} className={compact ? `btn-ghost h-9 w-9 !p-0 ${on ? "text-accent" : ""}` : `btn-outline btn-sm ${on ? "!border-accent text-accent" : ""}`} title={on ? labels.set : labels.remind} aria-label={on ? labels.set : labels.remind}>
      <I.Bell size={compact ? 18 : 16} />
      {!compact && (on ? labels.set : labels.remind)}
    </button>
  );
}

export function FollowButton({ targetType, targetId, active, signedIn, locale, labels }: { targetType: "program" | "presenter"; targetId: string; active: boolean; signedIn: boolean; locale: string; labels: { follow: string; following: string; signIn: string } }) {
  const { on, pending, toggle } = useToggle(active, (p) => toggleFollow(targetType, targetId, p));
  if (!signedIn) return <SignInLink locale={locale} label={labels.follow} />;
  return (
    <button type="button" onClick={toggle} disabled={pending} aria-pressed={on} className={on ? "btn-gold btn-sm" : "btn-outline btn-sm"}>
      {on ? <I.Check size={16} /> : null}
      {on ? labels.following : labels.follow}
    </button>
  );
}

export function FavoriteButton({ episodeId, active, signedIn, locale, labels }: { episodeId: string; active: boolean; signedIn: boolean; locale: string; labels: { save: string; saved: string; signIn: string } }) {
  const { on, pending, toggle } = useToggle(active, (p) => toggleFavorite(episodeId, p));
  if (!signedIn) return <SignInLink locale={locale} label={labels.signIn} />;
  return (
    <button type="button" onClick={toggle} disabled={pending} aria-pressed={on} className={`btn-outline btn-sm ${on ? "!border-accent text-accent" : ""}`}>
      <I.Heart size={16} filled={on} /> {on ? labels.saved : labels.save}
    </button>
  );
}

export function ShareButton({ url, title, labels }: { url: string; title: string; labels: { share: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const full = url.startsWith("http") ? url : `${location.origin}${url}`;
    try {
      if (navigator.share) await navigator.share({ title, url: full });
      else {
        await navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };
  return (
    <button type="button" onClick={share} className="btn-outline btn-sm">
      <I.Share size={16} /> {copied ? labels.copied : labels.share}
    </button>
  );
}
