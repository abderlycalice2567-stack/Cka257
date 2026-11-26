-- Gunter Automotive: service-request leads.
-- Apply in the Supabase SQL editor (or `supabase db push`) for EACH environment
-- (preview and production are separate projects).

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  name                  text not null check (char_length(name) between 2 and 100),
  phone                 text null check (phone is null or char_length(phone) <= 30),
  email                 text null check (email is null or char_length(email) <= 254),
  service               text not null check (service in ('maintenance', 'diagnostics', 'repair', 'not-sure')),
  -- Business-specific fields: vehicle_year, vehicle_make, vehicle_model,
  -- description, preferred_date (a request, not a booking), marketing_consent.
  details               jsonb not null default '{}'::jsonb,
  status                text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  consent_at            timestamptz not null,
  marketing_consent_at  timestamptz null,
  source                text not null default 'website',
  -- Duplicate-submission protection (client-generated per form session).
  idempotency_key       text null unique,
  -- Notification bookkeeping: a lead is never lost because email failed.
  notified_at           timestamptz null,
  notify_attempts       integer not null default 0,
  notify_error          text null,
  constraint leads_contact_required check (phone is not null or email is not null)
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_unnotified_idx on public.leads (created_at) where notified_at is null;

-- Row Level Security ON with NO policies: the anon and authenticated roles
-- cannot read or write at all. Only the server (service role, which bypasses
-- RLS) writes. Staff view leads in the Supabase dashboard with their own
-- least-privilege accounts.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;

-- Retention: the period must be agreed with the owner and reflected in /privacy.
-- Example (365 days), to run on a schedule with pg_cron once agreed:
--   delete from public.leads where created_at < now() - interval '365 days';
