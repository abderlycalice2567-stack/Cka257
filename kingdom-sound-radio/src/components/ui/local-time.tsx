"use client";

import { useEffect, useState } from "react";

/**
 * Server renders in the station's time zone; after hydration the value is
 * re-rendered in the listener's own time zone (automatic local conversion).
 */
export function LocalTime({
  iso,
  stationTz,
  intl,
  options = { hour: "numeric", minute: "2-digit" },
  showZone = false,
}: {
  iso: string;
  stationTz: string;
  intl: string;
  options?: Intl.DateTimeFormatOptions;
  showZone?: boolean;
}) {
  const opts = { ...options, ...(showZone ? { timeZoneName: "short" as const } : {}) };
  const [text, setText] = useState(() => new Intl.DateTimeFormat(intl, { ...opts, timeZone: stationTz }).format(new Date(iso)));
  const optsKey = JSON.stringify(opts);
  useEffect(() => {
    // The browser's zone is only known after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(new Intl.DateTimeFormat(intl, JSON.parse(optsKey)).format(new Date(iso)));
  }, [iso, intl, optsKey]);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}

export function Countdown({ iso, label }: { iso: string; label: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock starts after hydration
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const mins = Math.max(0, Math.round((new Date(iso).getTime() - now) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <span className="chip">
      {label} {h > 0 ? `${h}h ${m}m` : `${m}m`}
    </span>
  );
}
