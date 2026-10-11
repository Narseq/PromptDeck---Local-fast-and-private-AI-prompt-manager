import type { Db } from "@/db/client";
import { conflict, notFound } from "@/lib/errors";
import type { Category } from "@/lib/types";

const SELECT_CATEGORY = `
  SELECT c.id, c.name,
    (SELECT COUNT(*) FROM prompts p WHERE p.categoryId = c.id AND p.isDeleted = 0) AS promptCount
  FROM categories c`;

export function listCategories(db: Db): Category[] {
  return db.prepare(`${SELECT_CATEGORY} ORDER BY c.name COLLATE NOCASE`).all() as Category[];
}

export function createCategory(db: Db, input: { name: string }): Category {
  if (db.prepare("SELECT 1 FROM categories WHERE name = ?").get(input.name)) {
    throw conflict(`Category "${input.name}" already exists`);
  }
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)").run(
    id,
    input.name,
    new Date().toISOString(),
  );
  return db.prepare(`${SELECT_CATEGORY} WHERE c.id = ?`).get(id) as Category;
}

/** Prompts in the deleted category are kept and become uncategorized. */
export function deleteCategory(db: Db, id: string): void {
  if (!db.prepare("SELECT 1 FROM categories WHERE id = ?").get(id)) throw notFound("Category");
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
}
