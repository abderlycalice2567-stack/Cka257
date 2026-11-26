-- James Russell Smith Lawn Maintenance — lead storage
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Writes happen only from the server using the service-role key; the public
-- (anon) and signed-in (authenticated) roles have NO access.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  receipt_code            text not null unique,
  idempotency_key         uuid not null unique,
  name                    text not null check (char_length(name) between 1 and 100),
  phone                   text null check (phone is null or char_length(phone) <= 30),
  email                   text null check (email is null or char_length(email) <= 254),
  service                 text not null check (service in ('mowing', 'edging', 'routine-lawn-maintenance', 'not-sure')),
  -- description, zip, yard_size, frequency, access_notes, preferred_date, marketing_consent
  details                 jsonb not null default '{}'::jsonb check (pg_column_size(details) <= 8192),
  status                  text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'won', 'lost', 'archived')),
  consent_at              timestamptz not null,
  source                  text not null default 'website',
  -- owner notification delivery (retried by /api/cron/notify)
  notification_status     text not null default 'pending' check (notification_status in ('pending', 'sent', 'failed')),
  notification_attempts   integer not null default 0,
  last_notification_error text null,
  notified_at             timestamptz null,
  constraint leads_contact_required check (phone is not null or email is not null)
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_notification_pending_idx on public.leads (created_at) where notification_status <> 'sent';

-- Row-level security on with no policies = no access for anon/authenticated.
-- The service role bypasses RLS (server-only key). Staff view leads in the
-- Supabase dashboard (Table editor) under their own dashboard login.
alter table public.leads enable row level security;
alter table public.leads force row level security;
revoke all on table public.leads from anon, authenticated;

comment on table public.leads is 'Website lawn-service requests. Contains personal data — restrict access to authorized staff; apply the owner-approved retention policy.';

-- Retention helper (run manually or via pg_cron once the owner sets a period).
-- Example: delete archived/lost leads older than 24 months.
--   delete from public.leads where status in ('lost', 'archived') and created_at < now() - interval '24 months';
