export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  source TEXT DEFAULT 'alloy',
  model TEXT,
  provider TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  end_reason TEXT,
  message_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost REAL DEFAULT 0,
  branch TEXT,
  project_id TEXT,
  git_commit TEXT,
  parent_session_id TEXT,
  FOREIGN KEY (parent_session_id) REFERENCES sessions(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tool_calls TEXT,
  tool_name TEXT,
  tool_result TEXT,
  timestamp INTEGER NOT NULL,
  token_count INTEGER DEFAULT 0,
  model TEXT,
  cost REAL DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
  content,
  content=messages,
  content_rowid=id
);

CREATE TABLE IF NOT EXISTS memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  content TEXT NOT NULL,
  tags TEXT DEFAULT '',
  relevance REAL DEFAULT 0.5,
  created_at INTEGER NOT NULL,
  accessed_at INTEGER,
  source TEXT DEFAULT 'agent',
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
  content,
  tags,
  content=memory,
  content_rowid=id
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'user',
  category TEXT DEFAULT 'general',
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  state TEXT NOT NULL DEFAULT 'active',
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS context_banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  tags TEXT DEFAULT '',
  trigger_pattern TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  usage_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS plugin_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  version TEXT,
  source TEXT NOT NULL DEFAULT 'npm',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_memory_content ON memory(content);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory(tags);
CREATE INDEX IF NOT EXISTS idx_skills_state ON skills(state);
CREATE INDEX IF NOT EXISTS idx_context_banks_tags ON context_banks(tags);
`;

export function getMigrationSQL(fromVersion: number, toVersion: number): string[] {
  const migrations: string[] = [];

  if (fromVersion < 1 && toVersion >= 1) {
    migrations.push(SCHEMA_SQL);
  }

  return migrations;
}

export const CURRENT_SCHEMA_VERSION = 1;
