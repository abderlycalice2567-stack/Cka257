#!/usr/bin/env node
// Re-send owner notifications for stored leads whose email failed.
// Run on a schedule (e.g. Vercel Cron / GitHub Action) or by hand:
//   node --env-file=.env.local scripts/retry-notifications.mjs
// Logs receipt IDs only, never customer details.

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, LEAD_NOTIFY_FROM, LEAD_NOTIFY_TO } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY || !LEAD_NOTIFY_FROM || !LEAD_NOTIFY_TO) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, LEAD_NOTIFY_FROM or LEAD_NOTIFY_TO.");
  process.exit(1);
}
const base = SUPABASE_URL.replace(/\/$/, "");
const db = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
const MAX_ATTEMPTS = 10;

const res = await fetch(
  `${base}/rest/v1/leads?select=id,name,phone,email,service,details,notify_attempts&notified_at=is.null&status=neq.spam&notify_attempts=lt.${MAX_ATTEMPTS}&order=created_at.asc&limit=50`,
  { headers: db },
);
if (!res.ok) {
  console.error(JSON.stringify({ event: "retry.query_failed", status: res.status }));
  process.exit(1);
}
const leads = await res.json();
let sent = 0;
for (const l of leads) {
  const d = l.details ?? {};
  const text = [
    `New service request (re-sent) [${l.id}]`,
    `Name: ${l.name}`,
    l.phone && `Phone: ${l.phone}`,
    l.email && `Email: ${l.email}`,
    `Service: ${l.service}`,
    [d.vehicle_year, d.vehicle_make, d.vehicle_model].filter(Boolean).join(" ") && `Vehicle: ${[d.vehicle_year, d.vehicle_make, d.vehicle_model].filter(Boolean).join(" ")}`,
    d.preferred_date && `Preferred date (request only): ${d.preferred_date}`,
    "",
    d.description ?? "",
  ].filter((x) => x !== null && x !== undefined && x !== false).join("\n");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `lead-${l.id}` },
    body: JSON.stringify({ from: LEAD_NOTIFY_FROM, to: LEAD_NOTIFY_TO.split(",").map((s) => s.trim()), subject: `Service request (re-sent) [${l.id.slice(0, 8)}]`, text }),
  }).catch(() => null);
  const ok = Boolean(r?.ok);
  await fetch(`${base}/rest/v1/leads?id=eq.${l.id}`, {
    method: "PATCH",
    headers: { ...db, Prefer: "return=minimal" },
    body: JSON.stringify({ notified_at: ok ? new Date().toISOString() : null, notify_attempts: (l.notify_attempts ?? 0) + 1, notify_error: ok ? null : r ? `http_${r.status}` : "network" }),
  });
  console.log(JSON.stringify({ event: ok ? "retry.sent" : "retry.failed", receipt: l.id }));
  if (ok) sent++;
}
console.log(JSON.stringify({ event: "retry.done", pending: leads.length, sent }));
