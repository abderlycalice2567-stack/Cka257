-- Administrative multi-factor authentication (TOTP, RFC 6238).
-- The secret is stored encrypted (AES-256-GCM with APP_SECRET); see src/lib/auth/totp.ts.
ALTER TABLE users ADD COLUMN totp_secret_enc text;
ALTER TABLE users ADD COLUMN totp_enabled_at timestamptz;
ALTER TABLE users ADD COLUMN totp_last_step bigint;   -- rejects re-use of the same code
ALTER TABLE sessions ADD COLUMN mfa_verified_at timestamptz;
