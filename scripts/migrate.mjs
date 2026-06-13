// Plain-SQL migration runner.  Usage:  node scripts/migrate.mjs
//
// Applies every db/migrations/*.sql file in filename order, exactly once, inside
// a transaction, tracking applied files in a `schema_migrations` table.
//
// `pg` is an OPTIONAL dependency (the app's default store is the JSON file in
// data/store.json). Install it only when you move to Postgres:  npm i pg
// and set DATABASE_URL in your environment.

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "db", "migrations");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL is not set. Add it to your environment, e.g.:");
    console.error("    DATABASE_URL=postgres://user:pass@localhost:5432/cineconnect node scripts/migrate.mjs");
    process.exit(1);
  }

  let pg;
  try {
    pg = await import("pg");
  } catch {
    console.error("✗ The `pg` package is not installed. Run:  npm i pg");
    process.exit(1);
  }

  const { Client } = pg.default ?? pg;
  const client = new Client({
    connectionString: url,
    ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const { rows } = await client.query("SELECT filename FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.filename));

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`• skip   ${file} (already applied)`);
        continue;
      }
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`→ apply  ${file}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        count++;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }
    console.log(`\n✓ Migrations complete — ${count} applied, ${files.length - count} skipped.`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
