import type { Db } from "@/db/client";
import type { ImportPayload } from "@/lib/validation";
import { createPrompt, listPrompts } from "./prompts";

export interface ExportFile {
  app: "promptdeck";
  version: 1;
  exportedAt: string;
  categories: string[];
  tags: { name: string; color: string }[];
  prompts: ImportPayload["prompts"];
}

export function exportAll(db: Db): ExportFile {
  const categories = db.prepare("SELECT name FROM categories ORDER BY name").all() as {
    name: string;
  }[];
  const tags = db.prepare("SELECT name, color FROM tags ORDER BY name").all() as ExportFile["tags"];
  const { items } = listPrompts(db, {
    view: "all",
    sort: "oldest",
    page: 1,
    pageSize: 1_000_000,
  });

  return {
    app: "promptdeck",
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: categories.map((category) => category.name),
    tags,
    prompts: items.map((prompt) => ({
      title: prompt.title,
      content: prompt.content,
      description: prompt.description,
      category: prompt.categoryName,
      tags: prompt.tags.map((tag) => tag.name),
      isFavorite: prompt.isFavorite,
      language: prompt.language,
      translations: prompt.translations,
      usageCount: prompt.usageCount,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    })),
  };
}

/** Adds prompts from an export file. Prompts identical in title and content are skipped. */
export function importAll(db: Db, payload: ImportPayload): { imported: number; skipped: number } {
  const categoryIds = new Map<string, string>(
    (db.prepare("SELECT id, name FROM categories").all() as { id: string; name: string }[]).map(
      (row) => [row.name.toLowerCase(), row.id],
    ),
  );
  const tagIds = new Map<string, string>(
    (db.prepare("SELECT id, name FROM tags").all() as { id: string; name: string }[]).map((row) => [
      row.name.toLowerCase(),
      row.id,
    ]),
  );
  const now = () => new Date().toISOString();

  const ensureCategory = (name: string) => {
    const key = name.toLowerCase();
    let id = categoryIds.get(key);
    if (!id) {
      id = crypto.randomUUID();
      db.prepare("INSERT INTO categories (id, name, createdAt) VALUES (?, ?, ?)").run(
        id,
        name,
        now(),
      );
      categoryIds.set(key, id);
    }
    return id;
  };
  const ensureTag = (name: string, color = "#6366f1") => {
    const key = name.toLowerCase();
    let id = tagIds.get(key);
    if (!id) {
      id = crypto.randomUUID();
      db.prepare("INSERT INTO tags (id, name, color, createdAt) VALUES (?, ?, ?, ?)").run(
        id,
        name,
        color,
        now(),
      );
      tagIds.set(key, id);
    }
    return id;
  };

  const exists = db.prepare("SELECT 1 FROM prompts WHERE title = ? AND content = ?");
  let imported = 0;
  let skipped = 0;

  db.transaction(() => {
    payload.categories.forEach(ensureCategory);
    payload.tags.forEach((tag) => ensureTag(tag.name, tag.color));
    for (const item of payload.prompts) {
      if (exists.get(item.title, item.content)) {
        skipped += 1;
        continue;
      }
      createPrompt(
        db,
        {
          title: item.title,
          content: item.content,
          description: item.description,
          categoryId: item.category ? ensureCategory(item.category) : null,
          tagIds: item.tags.map((name) => ensureTag(name)),
          isFavorite: item.isFavorite,
          language: item.language,
          translations: item.translations,
        },
        { usageCount: item.usageCount, createdAt: item.createdAt, updatedAt: item.updatedAt },
      );
      imported += 1;
    }
  })();

  return { imported, skipped };
}
