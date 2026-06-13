-- 002_add_oauth_accounts.sql
-- One row per linked OAuth identity, so a single user can link Google + Apple +
-- Microsoft. Idempotent.

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            VARCHAR(50)  NOT NULL,            -- google | apple | microsoft
  provider_account_id VARCHAR(255) NOT NULL,
  access_token        TEXT,
  refresh_token       TEXT,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);
