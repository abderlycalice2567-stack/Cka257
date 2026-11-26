-- Lopez Auto Repair — lead storage
-- Apply in the Supabase SQL editor (or `supabase db push`) for EACH environment
-- (preview and production use separate Supabase projects).
--
-- Access model: the website writes with the service-role key from server code
-- only. Row Level Security is enabled with NO policies, so the public `anon`
-- and `authenticated` roles can neither read nor write. The owner reviews
-- leads in the Supabase dashboard (Table Editor) with their own login.

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  name             text not null check (char_length(name) between 2 and 100),
  phone            text check (phone is null or char_length(phone) <= 30),
  email            text check (email is null or char_length(email) <= 254),
  service          text not null check (service in ('general-repair', 'diagnostics', 'maintenance', 'not-sure')),
  -- Business-specific fields: description, vehicle_year, vehicle_make,
  -- vehicle_model, preferred_date, marketing_consent, receipt.
  details          jsonb not null default '{}'::jsonb check (pg_column_size(details) <= 8192),
  status           text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  consent_at       timestamptz not null,
  source           text not null default 'website',
  -- Prevents duplicate rows when a visitor double-submits or retries.
  idempotency_key  uuid not null unique,
  constraint leads_contact_required check (phone is not null or email is not null)
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

-- Owner-notification outbox. One row per lead, created in the same
-- transaction as the lead, so a stored lead can never lack a pending
-- notification even if the web request dies right after the insert.
create table if not exists public.lead_notifications (
  lead_id          uuid primary key references public.leads (id) on delete cascade,
  status           text not null default 'pending' check (status in ('pending', 'sent')),
  attempts         integer not null default 0,
  last_attempt_at  timestamptz,
  last_error       text,          -- error CODE only, never customer data
  sent_at          timestamptz
);

create index if not exists lead_notifications_pending_idx
  on public.lead_notifications (last_attempt_at nulls first) where status = 'pending';

create or replace function public.enqueue_lead_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.lead_notifications (lead_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists leads_enqueue_notification on public.leads;
create trigger leads_enqueue_notification
  after insert on public.leads
  for each row execute function public.enqueue_lead_notification();

-- Lock down: RLS on, no policies, no grants to public API roles.
alter table public.leads enable row level security;
alter table public.lead_notifications enable row level security;
revoke all on public.leads from anon, authenticated;
revoke all on public.lead_notifications from anon, authenticated;
revoke execute on function public.enqueue_lead_notification() from public, anon, authenticated;

-- Retention. The period is NOT decided yet — agree it with the owner and put
-- the same number in the privacy page. Then schedule, for example:
--
--   create extension if not exists pg_cron;
--   select cron.schedule('purge-old-leads', '15 3 * * *',
--     $$delete from public.leads where created_at < now() - interval '<AGREED PERIOD>'$$);
