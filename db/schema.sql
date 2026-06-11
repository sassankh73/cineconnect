-- CineConnect — PostgreSQL schema (relational, per tech_stack.database)
-- The JSON file store in lib/db.ts mirrors this 1:1 so it can be swapped for
-- a real Postgres client (pg / Prisma) without changing route handlers.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------- ENUMS ----------------
CREATE TYPE user_role        AS ENUM ('player', 'creator', 'admin');
CREATE TYPE profile_status   AS ENUM ('pending_payment', 'pending_review', 'active', 'suspended', 'expired');
CREATE TYPE payment_method   AS ENUM ('online_gateway', 'bank_transfer');
CREATE TYPE payment_status   AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE creator_plan     AS ENUM ('free', 'basic', 'pro');

-- ---------------- USERS ----------------
CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                CITEXT UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,                 -- bcrypt, never plaintext
  role                 user_role NOT NULL,
  security_question    TEXT,
  security_answer_hash TEXT,                          -- bcrypt of normalized answer
  email_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- PLAYER PROFILES ----------------
CREATE TABLE player_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name_persian     TEXT NOT NULL,
  full_name_latin       TEXT NOT NULL,
  date_of_birth         DATE NOT NULL,
  gender                TEXT NOT NULL,
  city                  TEXT NOT NULL,
  province              TEXT NOT NULL,
  willing_to_travel     BOOLEAN NOT NULL DEFAULT FALSE,
  phone                 TEXT NOT NULL,                 -- PROTECTED: hidden from creators pre-contact
  national_id_enc       TEXT NOT NULL,                 -- AES-256-GCM at rest; never returned
  primary_profession    TEXT NOT NULL,
  secondary_professions TEXT[] NOT NULL DEFAULT '{}',
  experience_level      TEXT NOT NULL,                 -- tier1..tier4
  years_experience      INT  NOT NULL DEFAULT 0,
  education_training     TEXT[] NOT NULL DEFAULT '{}',
  education_detail      TEXT,
  notable_projects      JSONB NOT NULL DEFAULT '[]',
  awards                TEXT,
  union_membership      TEXT,
  languages_spoken      TEXT[] NOT NULL DEFAULT '{}',
  physical_attributes   JSONB NOT NULL DEFAULT '{}',
  special_skills        TEXT[] NOT NULL DEFAULT '{}',
  availability          TEXT NOT NULL,
  daily_rate            TEXT,
  instagram             TEXT,
  imdb_link             TEXT,
  website               TEXT,
  media                 JSONB NOT NULL DEFAULT '{}',   -- {profile_photo, portfolio_photos[], video_reel, voice_sample, cv_pdf}
  tier                  INT  NOT NULL DEFAULT 1,
  status                profile_status NOT NULL DEFAULT 'pending_payment',
  paid_at               TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,                   -- created_at + 12 months on activation
  view_count            INT NOT NULL DEFAULT 0,
  contact_request_count INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_player_status      ON player_profiles(status);
CREATE INDEX idx_player_profession  ON player_profiles(primary_profession);
CREATE INDEX idx_player_city        ON player_profiles(city);
CREATE INDEX idx_player_tier        ON player_profiles(tier);

-- ---------------- CREATOR PROFILES ----------------
CREATE TABLE creator_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name                TEXT NOT NULL,
  company                  TEXT,
  role_title               TEXT,
  plan                     creator_plan NOT NULL DEFAULT 'free',
  contacts_used_this_month INT NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- PAYMENTS ----------------
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  tier          INT NOT NULL,
  amount_toman  INT NOT NULL,
  method        payment_method NOT NULL,
  gateway       TEXT,                                  -- ZarinPal | IDPay | Parsian
  status        payment_status NOT NULL DEFAULT 'pending',
  receipt_ref   TEXT,                                  -- bank transfer receipt upload
  confirmed_by  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at  TIMESTAMPTZ
);

-- ---------------- CONTACT REQUESTS (phone-unlock gate) ----------------
CREATE TABLE contact_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'sent',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id, player_id)
);

-- ---------------- BOOKMARKS (named collections) ----------------
CREATE TABLE bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection  TEXT NOT NULL,
  player_id   UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id, collection, player_id)
);

-- ---------------- REVIEWS ----------------
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  project     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- NOTIFICATIONS ----------------
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- AUDIT LOG (all logins & profile changes) ----------------
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  detail      TEXT,
  ip          INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- REPORTS (moderation queue) ----------------
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  player_id    UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
