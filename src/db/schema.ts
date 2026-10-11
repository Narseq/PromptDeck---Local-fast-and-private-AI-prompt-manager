/** Idempotent schema; executed on every start so a fresh database is created automatically. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  color     TEXT NOT NULL DEFAULT '#6366f1',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompts (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  language    TEXT NOT NULL DEFAULT 'en',
  categoryId  TEXT REFERENCES categories(id) ON DELETE SET NULL,
  isFavorite  INTEGER NOT NULL DEFAULT 0,
  isDeleted   INTEGER NOT NULL DEFAULT 0,
  usageCount  INTEGER NOT NULL DEFAULT 0,
  lastUsedAt  TEXT,
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompt_tags (
  promptId TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  tagId    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (promptId, tagId)
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id          TEXT PRIMARY KEY,
  promptId    TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  createdAt   TEXT NOT NULL,
  UNIQUE (promptId, version)
);

CREATE TABLE IF NOT EXISTS prompt_translations (
  promptId TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  title    TEXT NOT NULL DEFAULT '',
  content  TEXT NOT NULL,
  PRIMARY KEY (promptId, language)
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  promptId TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  usedAt   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prompts_deleted_created ON prompts (isDeleted, createdAt);
CREATE INDEX IF NOT EXISTS idx_prompts_category        ON prompts (categoryId);
CREATE INDEX IF NOT EXISTS idx_prompts_favorite        ON prompts (isFavorite) WHERE isFavorite = 1;
CREATE INDEX IF NOT EXISTS idx_prompts_last_used       ON prompts (lastUsedAt) WHERE lastUsedAt IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prompts_usage           ON prompts (usageCount);
CREATE INDEX IF NOT EXISTS idx_prompts_title           ON prompts (title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag         ON prompt_tags (tagId);
CREATE INDEX IF NOT EXISTS idx_versions_prompt         ON prompt_versions (promptId, version);
CREATE INDEX IF NOT EXISTS idx_usage_logs_prompt       ON usage_logs (promptId, usedAt);
`;

export const DEFAULT_CATEGORIES = [
  "Coding",
  "Writing",
  "Marketing",
  "Discord",
  "Debugging",
  "Translation",
] as const;
