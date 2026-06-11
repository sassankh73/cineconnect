import { promises as fs } from "fs";
import path from "path";
import type {
  User, PlayerProfile, CreatorProfile, Payment, ContactRequest,
  Bookmark, Review, Notification, AuditLog, Report,
} from "./types";

// ---------------------------------------------------------------------------
// Lightweight JSON-file data store.
//
// This stands in for PostgreSQL so the app RUNS without an external DB server.
// The shape mirrors db/schema.sql 1:1, so swapping in a real Postgres client
// (e.g. `pg` / Prisma) is a drop-in replacement of these accessor functions.
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
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const empty: DB = {
  users: [], players: [], creators: [], payments: [], contactRequests: [],
  bookmarks: [], reviews: [], notifications: [], auditLogs: [], reports: [],
};

// In-process cache + write serialization (avoids races within a single server).
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

export async function readDB(): Promise<DB> {
  if (cache) return cache;
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  cache = { ...empty, ...(JSON.parse(raw) as Partial<DB>) } as DB;
  return cache;
}

export async function writeDB(db: DB): Promise<void> {
  cache = db;
  writeChain = writeChain.then(async () => {
    await ensureFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
  });
  return writeChain;
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
