import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";
import type {
  User, PlayerProfile, CreatorProfile, Payment, ContactRequest,
  Bookmark, Review, Notification, AuditLog, Report,
  OAuthAccount, Session,
} from "./types";

// ---------------------------------------------------------------------------
// Data store with two backends, chosen at runtime:
//
//   • DATABASE_URL set  → Postgres. The entire DB object is persisted as a
//     single JSONB row (table `cc_store`, id='main'). Works on serverless
//     (Vercel) where the filesystem is read-only. The table is auto-created.
//
//   • DATABASE_URL unset → local JSON file (data/store.json). Zero-config dev.
//
// The object shape mirrors db/schema.sql. Note: the JSONB approach is whole-DB
// read/write per request (last-write-wins under heavy concurrent writes) — fine
// for launch; migrate to the relational schema (db/migrations/relational/) for
// high write concurrency.
// ---------------------------------------------------------------------------

export interface DB {
  users: User[];
  players: PlayerProfile[];
  creators: CreatorProfile[];
  payments: Payment[];
  contactRequests: ContactRequest[];
  bookmarks: Bookmark[];
  reviews: Review[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  reports: Report[];
  oauthAccounts: OAuthAccount[];
  sessions: Session[];
}

const empty: DB = {
  users: [], players: [], creators: [], payments: [], contactRequests: [],
  bookmarks: [], reviews: [], notifications: [], auditLogs: [], reports: [],
  oauthAccounts: [], sessions: [],
};

const DATABASE_URL =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
const USE_PG = !!DATABASE_URL;

// ============================ Postgres backend =============================
let pool: Pool | null = null;
let schemaReady = false;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX) || 3,
      ssl:
        process.env.PGSSL === "disable" || DATABASE_URL.includes("localhost")
          ? false
          : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureSchema(p: Pool): Promise<void> {
  if (schemaReady) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS cc_store (
      id         TEXT PRIMARY KEY,
      data       JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  schemaReady = true;
}

async function pgRead(): Promise<DB> {
  const p = getPool();
  await ensureSchema(p);
  const { rows } = await p.query<{ data: Partial<DB> }>("SELECT data FROM cc_store WHERE id = 'main'");
  if (rows[0]?.data) return { ...empty, ...rows[0].data };
  // First run: create the empty document.
  await p.query("INSERT INTO cc_store (id, data) VALUES ('main', $1) ON CONFLICT (id) DO NOTHING", [
    JSON.stringify(empty),
  ]);
  return { ...empty };
}

async function pgWrite(db: DB): Promise<void> {
  const p = getPool();
  await ensureSchema(p);
  await p.query(
    `INSERT INTO cc_store (id, data, updated_at) VALUES ('main', $1, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [JSON.stringify(db)]
  );
}

// ============================== File backend ===============================
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

// In-process cache + write serialization (file mode only).
let cache: DB | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(empty, null, 2), "utf8");
  }
}

async function fileRead(): Promise<DB> {
  if (cache) return cache;
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  cache = { ...empty, ...(JSON.parse(raw) as Partial<DB>) } as DB;
  return cache;
}

async function fileWrite(db: DB): Promise<void> {
  cache = db;
  writeChain = writeChain.then(async () => {
    await ensureFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
  });
  return writeChain;
}

// =============================== Public API ================================
export async function readDB(): Promise<DB> {
  return USE_PG ? pgRead() : fileRead();
}

export async function writeDB(db: DB): Promise<void> {
  return USE_PG ? pgWrite(db) : fileWrite(db);
}

// Convenience: read → mutate → write in one call.
export async function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const db = await readDB();
  const result = await fn(db);
  await writeDB(db);
  return result;
}

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
