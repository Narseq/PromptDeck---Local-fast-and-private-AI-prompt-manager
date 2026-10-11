import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DEFAULT_CATEGORIES, SCHEMA_SQL } from "./schema";
import { seedExamples } from "./seed";

export type Db = Database.Database;

/** Opens a database, creates the schema and, on a brand-new database, default data. */
export function openDatabase(file: string, options: { seedExamples: boolean }): Db {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  migrate(db);

  const isFresh = db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (isFresh.n === 0) {
    const insert = db.prepare("INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)");
    const now = new Date().toISOString();
    db.transaction(() => {
      for (const name of DEFAULT_CATEGORIES) insert.run(crypto.randomUUID(), name, now);
      if (options.seedExamples) seedExamples(db);
    })();
  }
  return db;
}

/** Upgrades databases created by earlier versions (CREATE TABLE IF NOT EXISTS leaves them as-is). */
function migrate(db: Db) {
  const columns = db.prepare("PRAGMA table_info(prompts)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "language")) {
    db.exec("ALTER TABLE prompts ADD COLUMN language TEXT NOT NULL DEFAULT 'en'");
  }
}

const globalForDb = globalThis as unknown as { promptdeckDb?: Db };

/** Process-wide singleton (survives hot reloads in development). */
export function getDb(): Db {
  if (!globalForDb.promptdeckDb) {
    const file = resolve(process.env.DATABASE_PATH ?? "./data/promptdeck.db");
    globalForDb.promptdeckDb = openDatabase(file, {
      seedExamples: process.env.SEED_EXAMPLES !== "false",
    });
  }
  return globalForDb.promptdeckDb;
}
