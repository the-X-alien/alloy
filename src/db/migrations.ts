import type Database from "better-sqlite3";
import { SCHEMA_SQL, CURRENT_SCHEMA_VERSION } from "./schema.js";

export function runMigrations(db: Database.Database): void {
  const currentVersion = db.prepare("PRAGMA user_version").get() as { user_version: number };
  const version = currentVersion?.user_version ?? 0;

  if (version < 1) {
    db.exec(SCHEMA_SQL);
    db.pragma("user_version = 1");
  }

  if (version < CURRENT_SCHEMA_VERSION) {
    db.pragma(`user_version = ${CURRENT_SCHEMA_VERSION}`);
  }
}
