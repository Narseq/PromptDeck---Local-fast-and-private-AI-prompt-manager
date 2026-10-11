import type { Db } from "@/db/client";
import { conflict, notFound } from "@/lib/errors";
import type { Tag } from "@/lib/types";

const SELECT_TAG = `
  SELECT t.id, t.name, t.color,
    (SELECT COUNT(*) FROM prompt_tags pt JOIN prompts p ON p.id = pt.promptId
      WHERE pt.tagId = t.id AND p.isDeleted = 0) AS promptCount
  FROM tags t`;

export function listTags(db: Db): Tag[] {
  return db.prepare(`${SELECT_TAG} ORDER BY t.name COLLATE NOCASE`).all() as Tag[];
}

function getTag(db: Db, id: string): Tag {
  const tag = db.prepare(`${SELECT_TAG} WHERE t.id = ?`).get(id) as Tag | undefined;
  if (!tag) throw notFound("Tag");
  return tag;
}

function assertNameFree(db: Db, name: string, exceptId?: string) {
  const existing = db.prepare("SELECT id FROM tags WHERE name = ?").get(name) as
    { id: string } | undefined;
  if (existing && existing.id !== exceptId) throw conflict(`Tag "${name}" already exists`);
}

export function createTag(db: Db, input: { name: string; color: string }): Tag {
  assertNameFree(db, input.name);
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)").run(
    id,
    input.name,
    input.color,
    new Date().toISOString(),
  );
  return getTag(db, id);
}

export function updateTag(db: Db, id: string, input: { name?: string; color?: string }): Tag {
  const current = getTag(db, id);
  if (input.name) assertNameFree(db, input.name, id);
  db.prepare("UPDATE tags SET name = ?, color = ? WHERE id = ?").run(
    input.name ?? current.name,
    input.color ?? current.color,
    id,
  );
  return getTag(db, id);
}

export function deleteTag(db: Db, id: string): void {
  getTag(db, id);
  db.prepare("DELETE FROM tags WHERE id = ?").run(id);
}
