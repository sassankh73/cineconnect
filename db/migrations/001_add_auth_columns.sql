-- 001_add_auth_columns.sql
-- Adds the authentication columns to the existing `users` table
-- (see db/schema.sql for the base table). Idempotent — safe to re-run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_token            TEXT,
  ADD COLUMN IF NOT EXISTS verification_token_expiry     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_resend_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification_resend_day       DATE,
  ADD COLUMN IF NOT EXISTS verification_last_sent_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reset_password_token          TEXT,
  ADD COLUMN IF NOT EXISTS reset_password_token_expiry   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider                      VARCHAR(50) DEFAULT 'credentials',
  ADD COLUMN IF NOT EXISTS provider_id                   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS full_name_persian             VARCHAR(255),
  ADD COLUMN IF NOT EXISTS full_name_latin               VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url                    TEXT,
  ADD COLUMN IF NOT EXISTS is_active                     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS failed_login_attempts         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lockout_until                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now();

-- password_hash must be NULLable for OAuth-only accounts.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Token lookups hit these columns on every verify/reset call.
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token        ON users(reset_password_token);
