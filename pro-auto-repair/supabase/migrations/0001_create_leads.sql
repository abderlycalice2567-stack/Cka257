-- Pro Auto Repair — leads table
-- Writes happen only from the server route (service-role key). Row level security is
-- enabled with NO policies, so anon/authenticated API roles can neither read nor write.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 2 and 100),
  phone       text check (phone is null or char_length(phone) <= 30),
  email       text check (email is null or char_length(email) <= 254),
  service     text not null check (char_length(service) <= 60),
  details     jsonb not null default '{}'::jsonb,
  status      text not null default 'new',
  consent_at  timestamptz not null,
  source      text not null default 'website-request-form',
  -- Operational addition to the handoff data model: null means the owner
  -- notification email has not (yet) been delivered and needs follow-up.
  notified_at timestamptz,
  constraint leads_contact_present check (phone is not null or email is not null)
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_unnotified_idx on public.leads (created_at) where notified_at is null;

alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;

comment on table public.leads is
  'Website service requests. No public access. Retention period to be agreed with the owner before launch.';

-- Retention (enable once the owner has agreed a period; example = 24 months):
-- delete from public.leads where created_at < now() - interval '24 months';
