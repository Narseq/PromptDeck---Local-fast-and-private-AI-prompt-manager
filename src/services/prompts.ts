import type { Db } from "@/db/client";
import { conflict, notFound } from "@/lib/errors";
import type { Locale } from "@/lib/i18n/messages";
import type {
  Prompt,
  PromptPage,
  PromptTranslation,
  PromptVersion,
  Stats,
  TagRef,
} from "@/lib/types";
import type { CreatePromptInput, ListPromptsQuery, UpdatePromptInput } from "@/lib/validation";

interface PromptRow {
  id: string;
  title: string;
  content: string;
  description: string;
  language: Locale;
  categoryId: string | null;
  categoryName: string | null;
  isFavorite: number;
  isDeleted: number;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const SELECT_PROMPT = `
  SELECT p.*, c.name AS categoryName
  FROM prompts p
  LEFT JOIN categories c ON c.id = p.categoryId`;

const ORDER_BY: Record<ListPromptsQuery["sort"], string> = {
  newest: "p.createdAt DESC",
  oldest: "p.createdAt ASC",
  "most-used": "p.usageCount DESC, p.createdAt DESC",
  alphabetical: "p.title COLLATE NOCASE ASC",
};

const escapeLike = (term: string) => term.replace(/[\\%_]/g, (char) => `\\${char}`);

function hydrate(db: Db, rows: PromptRow[]): Prompt[] {
  if (rows.length === 0) return [];
  const placeholders = rows.map(() => "?").join(",");
  const tagRows = db
    .prepare(
      `SELECT pt.promptId, t.id, t.name, t.color
       FROM prompt_tags pt JOIN tags t ON t.id = pt.tagId
       WHERE pt.promptId IN (${placeholders})
       ORDER BY t.name COLLATE NOCASE`,
    )
    .all(...rows.map((row) => row.id)) as (TagRef & { promptId: string })[];

  const tagsByPrompt = new Map<string, TagRef[]>();
  for (const { promptId, ...tag } of tagRows) {
    tagsByPrompt.set(promptId, [...(tagsByPrompt.get(promptId) ?? []), tag]);
  }

  const translationRows = db
    .prepare(
      `SELECT promptId, language, title, content FROM prompt_translations
       WHERE promptId IN (${placeholders}) ORDER BY language`,
    )
    .all(...rows.map((row) => row.id)) as (PromptTranslation & { promptId: string })[];
  const translationsByPrompt = new Map<string, PromptTranslation[]>();
  for (const { promptId, ...translation } of translationRows) {
    translationsByPrompt.set(promptId, [
      ...(translationsByPrompt.get(promptId) ?? []),
      translation,
    ]);
  }

  return rows.map((row) => ({
    ...row,
    isFavorite: row.isFavorite === 1,
    isDeleted: row.isDeleted === 1,
    tags: tagsByPrompt.get(row.id) ?? [],
    translations: translationsByPrompt.get(row.id) ?? [],
  }));
}

export function getPrompt(db: Db, id: string): Prompt {
  const row = db.prepare(`${SELECT_PROMPT} WHERE p.id = ?`).get(id) as PromptRow | undefined;
  if (!row) throw notFound("Prompt");
  return hydrate(db, [row])[0]!;
}

export function listPrompts(db: Db, query: ListPromptsQuery): PromptPage {
  const where: string[] = ["p.isDeleted = ?"];
  const params: (string | number)[] = [query.view === "trash" ? 1 : 0];

  if (query.view === "favorites") where.push("p.isFavorite = 1");
  if (query.view === "recent") where.push("p.lastUsedAt IS NOT NULL");
  if (query.categoryId) {
    where.push("p.categoryId = ?");
    params.push(query.categoryId);
  }
  if (query.tagId) {
    where.push("EXISTS (SELECT 1 FROM prompt_tags x WHERE x.promptId = p.id AND x.tagId = ?)");
    params.push(query.tagId);
  }
  for (const term of (query.q ?? "").split(/\s+/).filter(Boolean)) {
    const like = `%${escapeLike(term)}%`;
    where.push(`(
      p.title LIKE ? ESCAPE '\\' OR p.content LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\'
      OR EXISTS (
        SELECT 1 FROM prompt_tags x JOIN tags t ON t.id = x.tagId
        WHERE x.promptId = p.id AND t.name LIKE ? ESCAPE '\\'
      )
      OR EXISTS (
        SELECT 1 FROM prompt_translations tr
        WHERE tr.promptId = p.id AND (tr.title LIKE ? ESCAPE '\\' OR tr.content LIKE ? ESCAPE '\\')
      )
    )`);
    params.push(like, like, like, like, like, like);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const orderSql = query.view === "recent" ? "p.lastUsedAt DESC" : ORDER_BY[query.sort];
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM prompts p ${whereSql}`)
    .get(...params) as { total: number };
  const rows = db
    .prepare(`${SELECT_PROMPT} ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`)
    .all(...params, query.pageSize, (query.page - 1) * query.pageSize) as PromptRow[];

  return { items: hydrate(db, rows), total, page: query.page, pageSize: query.pageSize };
}

export function getStats(db: Db): Stats {
  return db
    .prepare(
      `SELECT
         COALESCE(SUM(isDeleted = 0), 0) AS "all",
         COALESCE(SUM(isDeleted = 0 AND isFavorite = 1), 0) AS favorites,
         COALESCE(SUM(isDeleted = 0 AND lastUsedAt IS NOT NULL), 0) AS recent,
         COALESCE(SUM(isDeleted = 1), 0) AS trash
       FROM prompts`,
    )
    .get() as Stats;
}

function assertReferences(db: Db, categoryId: string | null | undefined, tagIds: string[] = []) {
  if (categoryId && !db.prepare("SELECT 1 FROM categories WHERE id = ?").get(categoryId)) {
    throw notFound("Category");
  }
  const unique = [...new Set(tagIds)];
  if (unique.length > 0) {
    const found = db
      .prepare(`SELECT COUNT(*) AS n FROM tags WHERE id IN (${unique.map(() => "?").join(",")})`)
      .get(...unique) as { n: number };
    if (found.n !== unique.length) throw notFound("Tag");
  }
}

function setTags(db: Db, promptId: string, tagIds: string[]) {
  db.prepare("DELETE FROM prompt_tags WHERE promptId = ?").run(promptId);
  const insert = db.prepare("INSERT OR IGNORE INTO prompt_tags (promptId, tagId) VALUES (?, ?)");
  for (const tagId of tagIds) insert.run(promptId, tagId);
}

/** Replaces the translations of a prompt; the original language and empty texts are skipped. */
function setTranslations(
  db: Db,
  promptId: string,
  language: Locale,
  translations: { language: Locale; title: string; content: string }[],
) {
  db.prepare("DELETE FROM prompt_translations WHERE promptId = ?").run(promptId);
  const insert = db.prepare(
    "INSERT INTO prompt_translations (promptId, language, title, content) VALUES (?, ?, ?, ?)",
  );
  for (const item of translations) {
    if (item.language !== language && item.content.trim()) {
      insert.run(promptId, item.language, item.title, item.content);
    }
  }
}

function addVersion(
  db: Db,
  promptId: string,
  snapshot: { title: string; content: string; description: string },
  createdAt: string,
) {
  const { next } = db
    .prepare("SELECT COALESCE(MAX(version), 0) + 1 AS next FROM prompt_versions WHERE promptId = ?")
    .get(promptId) as { next: number };
  db.prepare(
    `INSERT INTO prompt_versions (id, promptId, version, title, content, description, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    crypto.randomUUID(),
    promptId,
    next,
    snapshot.title,
    snapshot.content,
    snapshot.description,
    createdAt,
  );
}

export function createPrompt(
  db: Db,
  input: CreatePromptInput,
  extra: { usageCount?: number; createdAt?: string; updatedAt?: string } = {},
): Prompt {
  assertReferences(db, input.categoryId, input.tagIds);
  const id = crypto.randomUUID();
  const createdAt = extra.createdAt ?? new Date().toISOString();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO prompts (id, title, content, description, language, categoryId, isFavorite, usageCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.title,
      input.content,
      input.description,
      input.language,
      input.categoryId,
      input.isFavorite ? 1 : 0,
      extra.usageCount ?? 0,
      createdAt,
      extra.updatedAt ?? createdAt,
    );
    setTags(db, id, input.tagIds);
    setTranslations(db, id, input.language, input.translations);
    addVersion(db, id, input, createdAt);
  })();
  return getPrompt(db, id);
}

/** Editing title, content or description records a new version; other fields do not. */
export function updatePrompt(db: Db, id: string, input: UpdatePromptInput): Prompt {
  const current = getPrompt(db, id);
  if (current.isDeleted) throw conflict("Restore the prompt from trash before editing it");
  assertReferences(db, input.categoryId, input.tagIds);

  const next = {
    title: input.title ?? current.title,
    content: input.content ?? current.content,
    description: input.description ?? current.description,
  };
  const language = input.language ?? current.language;
  const textChanged =
    next.title !== current.title ||
    next.content !== current.content ||
    next.description !== current.description;
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(
      `UPDATE prompts SET title = ?, content = ?, description = ?, language = ?, categoryId = ?, isFavorite = ?, updatedAt = ?
       WHERE id = ?`,
    ).run(
      next.title,
      next.content,
      next.description,
      language,
      input.categoryId !== undefined ? input.categoryId : current.categoryId,
      (input.isFavorite ?? current.isFavorite) ? 1 : 0,
      now,
      id,
    );
    if (input.tagIds) setTags(db, id, input.tagIds);
    if (input.translations) {
      setTranslations(db, id, language, input.translations);
    } else if (language !== current.language) {
      db.prepare("DELETE FROM prompt_translations WHERE promptId = ? AND language = ?").run(
        id,
        language,
      );
    }
    if (textChanged) addVersion(db, id, next, now);
  })();
  return getPrompt(db, id);
}

export function duplicatePrompt(db: Db, id: string): Prompt {
  const source = getPrompt(db, id);
  return createPrompt(db, {
    title: `${source.title} (copy)`.slice(0, 200),
    content: source.content,
    description: source.description,
    language: source.language,
    translations: source.translations,
    categoryId: source.categoryId,
    tagIds: source.tags.map((tag) => tag.id),
    isFavorite: false,
  });
}

export function moveToTrash(db: Db, id: string): void {
  setDeleted(db, id, true);
}

export function restoreFromTrash(db: Db, id: string): Prompt {
  setDeleted(db, id, false);
  return getPrompt(db, id);
}

function setDeleted(db: Db, id: string, isDeleted: boolean) {
  getPrompt(db, id);
  db.prepare("UPDATE prompts SET isDeleted = ?, updatedAt = ? WHERE id = ?").run(
    isDeleted ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export function deletePermanently(db: Db, id: string): void {
  if (!getPrompt(db, id).isDeleted) throw conflict("Move the prompt to trash first");
  db.prepare("DELETE FROM prompts WHERE id = ?").run(id);
}

export function recordUse(db: Db, id: string): Prompt {
  const prompt = getPrompt(db, id);
  if (prompt.isDeleted) throw conflict("Restore the prompt from trash before using it");
  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare("UPDATE prompts SET usageCount = usageCount + 1, lastUsedAt = ? WHERE id = ?").run(
      now,
      id,
    );
    db.prepare("INSERT INTO usage_logs (promptId, usedAt) VALUES (?, ?)").run(id, now);
  })();
  return getPrompt(db, id);
}

export function listVersions(db: Db, promptId: string): PromptVersion[] {
  getPrompt(db, promptId);
  return db
    .prepare("SELECT * FROM prompt_versions WHERE promptId = ? ORDER BY version DESC")
    .all(promptId) as PromptVersion[];
}

export function restoreVersion(db: Db, promptId: string, version: number): Prompt {
  const snapshot = db
    .prepare("SELECT * FROM prompt_versions WHERE promptId = ? AND version = ?")
    .get(promptId, version) as PromptVersion | undefined;
  if (!snapshot) throw notFound("Version");
  return updatePrompt(db, promptId, {
    title: snapshot.title,
    content: snapshot.content,
    description: snapshot.description,
  });
}
