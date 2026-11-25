// Applies db/migrations/*.sql in order, once each, inside transactions.
// Usage: node scripts/migrate.mjs [--reset] [--url <connection string>]
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { loadEnv } from "./env.mjs";

loadEnv();
const args = process.argv.slice(2);
const urlIdx = args.indexOf("--url");
const url = urlIdx >= 0 ? args[urlIdx + 1] : process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = postgres(url, { onnotice: () => {} });
try {
  if (args.includes("--reset")) {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset in production");
    await sql.unsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("schema reset");
  }
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  const done = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));
  const dir = path.resolve("db/migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const body = fs.readFileSync(path.join(dir, f), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${f})`;
    });
    console.log("applied", f);
  }
  console.log("migrations up to date");
} finally {
  await sql.end();
}
