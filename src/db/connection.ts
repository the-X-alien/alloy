import Database from "better-sqlite3";
import * as path from "node:path";
import * as os from "node:os";
import { ensureDir } from "../util/fs.js";
import { runMigrations } from "./migrations.js";

const DB_PATH = path.join(os.homedir(), ".alloy", "alloy.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  ensureDir(path.dirname(DB_PATH));

  db = new Database(DB_PATH);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  runMigrations(db);

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function withDb<T>(fn: (db: Database.Database) => T): T {
  const database = getDb();
  return fn(database);
}
