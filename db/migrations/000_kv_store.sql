-- 000_kv_store.sql
-- Active migration for the JSONB document-store backend (lib/db.ts).
-- The whole DB object is persisted as a single JSONB row (id='main').
-- lib/db.ts also creates this table automatically on first connect, so running
-- migrations is OPTIONAL for this backend — provided here for completeness.
--
-- The relational schema (db/migrations/relational/001..003) is kept for a future
-- full relational port and is NOT run by scripts/migrate.mjs.

CREATE TABLE IF NOT EXISTS cc_store (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
