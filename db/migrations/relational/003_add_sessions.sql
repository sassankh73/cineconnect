-- 003_add_sessions.sql
-- Server-side session registry — enables true invalidation on logout and on
-- password change/reset. `id` is the `sid` claim embedded in the JWT; the app
-- supplies it explicitly, so the gen_random_uuid() default is only a fallback.
-- `token_hash` is the SHA-256 of the refresh token (never the raw token).

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
