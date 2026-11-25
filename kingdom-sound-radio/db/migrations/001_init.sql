-- The Kingdom Sound Radio — initial schema
-- PostgreSQL 15+ (compatible with Supabase). All timestamps are stored in UTC
-- (timestamptz); the station's local timezone lives on `stations.timezone`.
-- Translatable text is stored as jsonb: {"en": "...", "fr": "...", "ht": "..."}.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- array_to_string() is only STABLE; this wrapper is safe for text[] input and
-- lets the episodes search vector be a generated column.
CREATE FUNCTION immutable_array_join(text[]) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT array_to_string($1, ' ') $$;

-- ---------------------------------------------------------------- identity
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext NOT NULL UNIQUE,
  password_hash     text NOT NULL,
  display_name      text NOT NULL,
  locale            text NOT NULL DEFAULT 'en' CHECK (locale IN ('en','fr','ht')),
  email_verified_at timestamptz,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);

CREATE TABLE roles (
  key         text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_staff    boolean NOT NULL DEFAULT true
);

CREATE TABLE permissions (
  key         text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE role_permissions (
  role_key       text NOT NULL REFERENCES roles(key) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE user_roles (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_key   text NOT NULL REFERENCES roles(key) ON DELETE CASCADE,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_key)
);

CREATE TABLE sessions (
  id         text PRIMARY KEY,            -- SHA-256 of the opaque cookie token
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ip         text,
  user_agent text
);
CREATE INDEX sessions_user_idx ON sessions(user_id);

CREATE TABLE email_tokens (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    text NOT NULL CHECK (purpose IN ('verify','reset')),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_preferences (
  user_id               uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_program_updates boolean NOT NULL DEFAULT true,
  email_reminders       boolean NOT NULL DEFAULT true,
  email_marketing       boolean NOT NULL DEFAULT false,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- station
CREATE TABLE stations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  name           text NOT NULL,
  tagline        jsonb NOT NULL DEFAULT '{}',
  timezone       text NOT NULL DEFAULT 'America/New_York',
  default_locale text NOT NULL DEFAULT 'en',
  contact_email  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stream_endpoints (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id   uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  label        text NOT NULL,
  url          text NOT NULL CHECK (url ~ '^https://'),
  bitrate_kbps integer NOT NULL CHECK (bitrate_kbps BETWEEN 16 AND 512),
  format       text NOT NULL DEFAULT 'mp3',
  is_default   boolean NOT NULL DEFAULT false,
  enabled      boolean NOT NULL DEFAULT true,
  sort         integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------- media
CREATE TABLE media_assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind             text NOT NULL CHECK (kind IN ('audio','image','video','document')),
  storage_key      text NOT NULL UNIQUE,
  mime_type        text NOT NULL,
  bytes            bigint NOT NULL,
  duration_seconds integer,
  original_name    text,
  processing       text NOT NULL DEFAULT 'ready' CHECK (processing IN ('pending','processing','ready','failed')),
  uploaded_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- programming
CREATE TABLE categories (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  text NOT NULL UNIQUE,
  name  jsonb NOT NULL,
  sort  integer NOT NULL DEFAULT 0
);

CREATE TABLE presenters (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  display_name   text NOT NULL,
  title          jsonb NOT NULL DEFAULT '{}',
  bio            jsonb NOT NULL DEFAULT '{}',
  photo_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  published      boolean NOT NULL DEFAULT true,
  is_sample      boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE programs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  title             jsonb NOT NULL,
  summary           jsonb NOT NULL DEFAULT '{}',
  description       jsonb NOT NULL DEFAULT '{}',
  category_id       uuid REFERENCES categories(id) ON DELETE SET NULL,
  languages         text[] NOT NULL DEFAULT '{en}',
  cover_asset_id    uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  featured          boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  podcast_enabled   boolean NOT NULL DEFAULT false,
  podcast_author    text,
  podcast_category  text NOT NULL DEFAULT 'Religion & Spirituality',
  podcast_explicit  boolean NOT NULL DEFAULT false,
  external_links    jsonb NOT NULL DEFAULT '{}',   -- {"spotify": "...", "apple": "...", "youtube": "..."}
  is_sample         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX programs_status_idx ON programs(status);

CREATE TABLE program_presenters (
  program_id   uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  presenter_id uuid NOT NULL REFERENCES presenters(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'host',
  sort         integer NOT NULL DEFAULT 0,
  PRIMARY KEY (program_id, presenter_id)
);

CREATE TABLE seasons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  number     integer NOT NULL,
  title      text,
  UNIQUE (program_id, number)
);

-- Recurring rule, expressed in the station's local time.
CREATE TABLE broadcast_schedules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  weekdays         smallint[] NOT NULL CHECK (array_length(weekdays,1) >= 1 AND weekdays <@ ARRAY[0,1,2,3,4,5,6]::smallint[]),
  start_time       time NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 1440),
  valid_from       date NOT NULL DEFAULT CURRENT_DATE,
  valid_until      date,
  is_rebroadcast   boolean NOT NULL DEFAULT false,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- A concrete airing. Generated from schedules, or created as a special.
CREATE TABLE broadcast_occurrences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES broadcast_schedules(id) ON DELETE SET NULL,
  program_id  uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  episode_id  uuid,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL CHECK (ends_at > starts_at),
  status      text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled','rescheduled','aired')),
  is_special  boolean NOT NULL DEFAULT false,
  is_rebroadcast boolean NOT NULL DEFAULT false,
  note        text,
  manually_edited boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, starts_at)
);
CREATE INDEX occurrences_time_idx ON broadcast_occurrences(starts_at, ends_at);

CREATE TABLE episodes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id        uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  season_id         uuid REFERENCES seasons(id) ON DELETE SET NULL,
  number            integer,
  slug              text NOT NULL,
  title             text NOT NULL,
  description       text NOT NULL DEFAULT '',
  language          text NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr','ht')),
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN
                      ('draft','scheduled','recording','processing','awaiting_review','approved','published','archived','rejected','failed')),
  original_air_date timestamptz,
  published_at      timestamptz,
  audio_asset_id    uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  cover_asset_id    uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  duration_seconds  integer,
  transcript        text,
  scripture_refs    text[] NOT NULL DEFAULT '{}',
  topics            text[] NOT NULL DEFAULT '{}',
  downloadable      boolean NOT NULL DEFAULT false,
  rights_confirmed  boolean NOT NULL DEFAULT false,
  guid              uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,  -- stable podcast GUID
  is_sample         boolean NOT NULL DEFAULT false,
  search            tsvector GENERATED ALWAYS AS (
                      setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
                      setweight(to_tsvector('simple', coalesce(description,'')), 'B') ||
                      setweight(to_tsvector('simple', immutable_array_join(scripture_refs) || ' ' || immutable_array_join(topics)), 'B') ||
                      setweight(to_tsvector('simple', coalesce(transcript,'')), 'C')
                    ) STORED,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, slug),
  -- Publishing requires media and a rights review.
  CONSTRAINT published_requires_rights CHECK (status <> 'published' OR (rights_confirmed AND published_at IS NOT NULL))
);
CREATE INDEX episodes_search_idx ON episodes USING gin(search);
CREATE INDEX episodes_status_idx ON episodes(status, published_at DESC);

ALTER TABLE broadcast_occurrences
  ADD CONSTRAINT occurrences_episode_fk FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE SET NULL;

CREATE TABLE episode_chapters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id    uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  start_seconds integer NOT NULL CHECK (start_seconds >= 0),
  title         text NOT NULL
);

CREATE TABLE broadcast_recordings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id  uuid REFERENCES broadcast_occurrences(id) ON DELETE SET NULL,
  media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  episode_id     uuid REFERENCES episodes(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- editorial
CREATE TABLE articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL,
  locale       text NOT NULL CHECK (locale IN ('en','fr','ht')),
  title        text NOT NULL,
  excerpt      text NOT NULL DEFAULT '',
  body         text NOT NULL DEFAULT '',
  category     text NOT NULL DEFAULT 'news',
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at timestamptz,
  author_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  is_sample    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, locale)
);

CREATE TABLE devotionals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day            date NOT NULL,
  locale         text NOT NULL CHECK (locale IN ('en','fr','ht')),
  title          text NOT NULL,
  scripture_ref  text NOT NULL,
  scripture_text text NOT NULL DEFAULT '',
  translation    text NOT NULL DEFAULT '',
  body           text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  is_sample      boolean NOT NULL DEFAULT false,
  UNIQUE (day, locale)
);

CREATE TABLE pages (
  slug       text NOT NULL,
  locale     text NOT NULL CHECK (locale IN ('en','fr','ht')),
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  is_sample  boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (slug, locale)
);

CREATE TABLE events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 text NOT NULL UNIQUE,
  title                jsonb NOT NULL,
  description          jsonb NOT NULL DEFAULT '{}',
  kind                 text NOT NULL DEFAULT 'community',
  starts_at            timestamptz NOT NULL,
  ends_at              timestamptz,
  location             text NOT NULL DEFAULT '',
  registration_enabled boolean NOT NULL DEFAULT false,
  capacity             integer,
  status               text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled')),
  is_sample            boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE event_registrations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  name       text NOT NULL,
  email      citext NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

-- ---------------------------------------------------------------- engagement
CREATE TABLE favorites (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

CREATE TABLE follows (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('program','presenter')),
  target_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE TABLE playback_progress (
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  episode_id       uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  position_seconds integer NOT NULL CHECK (position_seconds >= 0),
  completed        boolean NOT NULL DEFAULT false,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, episode_id)
);

CREATE TABLE listening_history (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('live','episode')),
  episode_id uuid REFERENCES episodes(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listening_history_user_idx ON listening_history(user_id, started_at DESC);

CREATE TABLE broadcast_reminders (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, program_id)
);

-- ---------------------------------------------------------------- community
CREATE TABLE prayer_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  name         text NOT NULL,
  email        citext,
  body         text NOT NULL,
  visibility   text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public_anonymous','public_named')),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','answered')),
  assigned_to  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  retain_until timestamptz NOT NULL DEFAULT now() + interval '180 days'
);

CREATE TABLE testimonies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  name            text NOT NULL,
  email           citext,
  body            text NOT NULL,
  consent_publish boolean NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  featured        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz,
  CONSTRAINT approval_requires_consent CHECK (status <> 'approved' OR consent_publish)
);

CREATE TABLE contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      citext NOT NULL,
  topic      text NOT NULL DEFAULT 'general',
  body       text NOT NULL,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_subscribers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            citext NOT NULL UNIQUE,
  locale           text NOT NULL DEFAULT 'en',
  consent_marketing boolean NOT NULL,
  consented_at     timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at  timestamptz
);

CREATE TABLE consent_records (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  email      citext,
  kind       text NOT NULL,
  granted    boolean NOT NULL,
  source     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- finance
CREATE TABLE fundraising_campaigns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  title      jsonb NOT NULL,
  goal_cents bigint,
  currency   text NOT NULL DEFAULT 'usd',
  active     boolean NOT NULL DEFAULT true,
  is_sample  boolean NOT NULL DEFAULT false
);

CREATE TABLE donations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  campaign_id  uuid REFERENCES fundraising_campaigns(id) ON DELETE SET NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency     text NOT NULL,
  recurring    boolean NOT NULL DEFAULT false,
  status       text NOT NULL CHECK (status IN ('pending','succeeded','failed','refunded')),
  provider     text NOT NULL,
  provider_ref text NOT NULL UNIQUE,     -- idempotency: one row per provider object
  email        citext,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sponsorship_inquiries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  organization text NOT NULL,
  email        citext NOT NULL,
  message      text NOT NULL,
  status       text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- operations
CREATE TABLE platform_integrations (
  key         text PRIMARY KEY,
  name        text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('podcast','live_directory','video','social')),
  url         text CHECK (url IS NULL OR url ~ '^https://'),
  identifier  text,
  enabled     boolean NOT NULL DEFAULT false,
  verified_at timestamptz,             -- set by a staff member after testing the link
  last_error  text,
  sort        integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE background_jobs (
  id         bigserial PRIMARY KEY,
  kind       text NOT NULL,
  payload    jsonb NOT NULL DEFAULT '{}',
  status     text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  attempts   integer NOT NULL DEFAULT 0,
  last_error text,
  run_at     timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX background_jobs_queue_idx ON background_jobs(status, run_at);

CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   text,
  metadata    jsonb NOT NULL DEFAULT '{}',
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at DESC);
