import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "@/db/client";
import { AppError } from "@/lib/errors";
import { importSchema, listPromptsSchema } from "@/lib/validation";
import { createCategory, listCategories } from "@/services/categories";
import {
  createPrompt,
  deletePermanently,
  duplicatePrompt,
  getPrompt,
  getStats,
  listPrompts,
  listVersions,
  moveToTrash,
  recordUse,
  restoreFromTrash,
  restoreVersion,
  updatePrompt,
} from "@/services/prompts";
import { createTag, deleteTag, listTags } from "@/services/tags";
import { exportAll, importAll } from "@/services/transfer";

let db: Db;

const query = (overrides: Record<string, unknown> = {}) => listPromptsSchema.parse(overrides);
const newPrompt = (title: string, content = "Body", extra = {}) =>
  createPrompt(db, {
    title,
    content,
    description: "",
    categoryId: null,
    tagIds: [],
    isFavorite: false,
    language: "en",
    translations: [],
    ...extra,
  });

beforeEach(() => {
  db = openDatabase(":memory:", { seedExamples: false });
});

describe("database initialisation", () => {
  it("creates default categories on a fresh database", () => {
    expect(listCategories(db).map((c) => c.name)).toEqual(
      expect.arrayContaining([
        "Coding",
        "Writing",
        "Marketing",
        "Discord",
        "Debugging",
        "Translation",
      ]),
    );
  });

  it("seeds ten examples when enabled", () => {
    const seeded = openDatabase(":memory:", { seedExamples: true });
    expect(listPrompts(seeded, query()).total).toBe(10);
  });
});

describe("prompt CRUD", () => {
  it("creates a prompt with its first version", () => {
    const prompt = newPrompt("Hello");
    expect(prompt.isFavorite).toBe(false);
    expect(listVersions(db, prompt.id)).toHaveLength(1);
  });

  it("rejects unknown references", () => {
    expect(() => newPrompt("X", "Y", { categoryId: "missing" })).toThrow(AppError);
    expect(() => newPrompt("X", "Y", { tagIds: ["missing"] })).toThrow(AppError);
  });

  it("duplicates a prompt with tags and resets counters", () => {
    const tag = createTag(db, { name: "a", color: "#112233" });
    const original = newPrompt("Orig", "Body", { tagIds: [tag.id], isFavorite: true });
    recordUse(db, original.id);
    const copy = duplicatePrompt(db, original.id);
    expect(copy.title).toBe("Orig (copy)");
    expect(copy.tags.map((t) => t.name)).toEqual(["a"]);
    expect(copy.usageCount).toBe(0);
    expect(copy.isFavorite).toBe(false);
  });

  it("counts uses and logs them", () => {
    const prompt = newPrompt("Use me");
    recordUse(db, prompt.id);
    const used = recordUse(db, prompt.id);
    expect(used.usageCount).toBe(2);
    expect(used.lastUsedAt).not.toBeNull();
    const logs = db.prepare("SELECT COUNT(*) AS n FROM usage_logs").get() as { n: number };
    expect(logs.n).toBe(2);
  });
});

describe("trash", () => {
  it("moves to trash, restores and deletes permanently", () => {
    const prompt = newPrompt("Temp");
    expect(() => deletePermanently(db, prompt.id)).toThrow(/trash first/);

    moveToTrash(db, prompt.id);
    expect(listPrompts(db, query()).total).toBe(0);
    expect(listPrompts(db, query({ view: "trash" })).total).toBe(1);
    expect(() => updatePrompt(db, prompt.id, { title: "x" })).toThrow(AppError);

    expect(restoreFromTrash(db, prompt.id).isDeleted).toBe(false);
    moveToTrash(db, prompt.id);
    deletePermanently(db, prompt.id);
    expect(() => getPrompt(db, prompt.id)).toThrow(/not found/);
    expect(getStats(db)).toEqual({ all: 0, favorites: 0, recent: 0, trash: 0 });
  });
});

describe("search, filters and sorting", () => {
  beforeEach(() => {
    const coding = listCategories(db).find((c) => c.name === "Coding")!;
    const tag = createTag(db, { name: "urgent", color: "#ff0000" });
    newPrompt("Alpha", "write python code", { categoryId: coding.id, tagIds: [tag.id] });
    newPrompt("Beta", "translate text", { description: "100% accurate_ish", isFavorite: true });
    newPrompt("Gamma", "other");
  });

  it("searches title, content, description and tags", () => {
    expect(listPrompts(db, query({ q: "python" })).items.map((p) => p.title)).toEqual(["Alpha"]);
    expect(listPrompts(db, query({ q: "accurate" })).items.map((p) => p.title)).toEqual(["Beta"]);
    expect(listPrompts(db, query({ q: "urgent" })).items.map((p) => p.title)).toEqual(["Alpha"]);
    expect(listPrompts(db, query({ q: "python urgent" })).total).toBe(1);
    expect(listPrompts(db, query({ q: "python translate" })).total).toBe(0);
  });

  it("treats LIKE wildcards literally", () => {
    expect(listPrompts(db, query({ q: "100%" })).total).toBe(1);
    expect(listPrompts(db, query({ q: "%" })).total).toBe(1);
    expect(listPrompts(db, query({ q: "_" })).total).toBe(1);
  });

  it("filters by category, tag and favorites", () => {
    const coding = listCategories(db).find((c) => c.name === "Coding")!;
    const tag = listTags(db)[0]!;
    expect(listPrompts(db, query({ categoryId: coding.id })).total).toBe(1);
    expect(listPrompts(db, query({ tagId: tag.id })).total).toBe(1);
    expect(listPrompts(db, query({ view: "favorites" })).items.map((p) => p.title)).toEqual([
      "Beta",
    ]);
  });

  it("filters recently used prompts, latest first", () => {
    const [gamma, alpha] = [
      listPrompts(db, query({ q: "Gamma" })).items[0]!,
      listPrompts(db, query({ q: "Alpha" })).items[0]!,
    ];
    recordUse(db, gamma.id);
    recordUse(db, alpha.id);
    const titles = listPrompts(db, query({ view: "recent" })).items.map((p) => p.title);
    expect(titles).toEqual(["Alpha", "Gamma"]);
  });

  it("sorts alphabetically and by usage", () => {
    expect(listPrompts(db, query({ sort: "alphabetical" })).items.map((p) => p.title)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    const beta = listPrompts(db, query({ q: "Beta" })).items[0]!;
    recordUse(db, beta.id);
    expect(listPrompts(db, query({ sort: "most-used" })).items[0]!.title).toBe("Beta");
  });

  it("paginates", () => {
    const page = listPrompts(db, query({ pageSize: 2, page: 2, sort: "alphabetical" }));
    expect(page.total).toBe(3);
    expect(page.items.map((p) => p.title)).toEqual(["Gamma"]);
  });
});

describe("versioning", () => {
  it("adds a version only when text changes", () => {
    const prompt = newPrompt("V1", "one");
    updatePrompt(db, prompt.id, { isFavorite: true });
    expect(listVersions(db, prompt.id)).toHaveLength(1);

    updatePrompt(db, prompt.id, { content: "two" });
    updatePrompt(db, prompt.id, { content: "two" });
    const versions = listVersions(db, prompt.id);
    expect(versions.map((v) => v.version)).toEqual([2, 1]);
    expect(versions[0]!.content).toBe("two");
  });

  it("restores an older version as a new version", () => {
    const prompt = newPrompt("V1", "one");
    updatePrompt(db, prompt.id, { content: "two" });
    const restored = restoreVersion(db, prompt.id, 1);
    expect(restored.content).toBe("one");
    expect(listVersions(db, prompt.id)).toHaveLength(3);
    expect(() => restoreVersion(db, prompt.id, 99)).toThrow(/not found/);
  });
});

describe("tags and categories", () => {
  it("rejects duplicate names case-insensitively", () => {
    createTag(db, { name: "Work", color: "#112233" });
    expect(() => createTag(db, { name: "work", color: "#112233" })).toThrow(/already exists/);
    expect(() => createCategory(db, { name: "coding" })).toThrow(/already exists/);
  });

  it("removes a tag from prompts when deleted", () => {
    const tag = createTag(db, { name: "tmp", color: "#112233" });
    const prompt = newPrompt("P", "C", { tagIds: [tag.id] });
    deleteTag(db, tag.id);
    expect(getPrompt(db, prompt.id).tags).toEqual([]);
  });
});

describe("import and export", () => {
  it("round-trips data and skips duplicates on re-import", () => {
    const tag = createTag(db, { name: "x", color: "#abcdef" });
    const coding = listCategories(db).find((c) => c.name === "Coding")!;
    newPrompt("One", "Body {{v}}", { tagIds: [tag.id], categoryId: coding.id, isFavorite: true });

    const exported = JSON.parse(JSON.stringify(exportAll(db)));
    const target = openDatabase(":memory:", { seedExamples: false });
    const payload = importSchema.parse(exported);

    expect(importAll(target, payload)).toEqual({ imported: 1, skipped: 0 });
    expect(importAll(target, payload)).toEqual({ imported: 0, skipped: 1 });

    const [imported] = listPrompts(target, listPromptsSchema.parse({})).items;
    expect(imported).toMatchObject({ title: "One", categoryName: "Coding", isFavorite: true });
    expect(imported!.tags.map((t) => t.name)).toEqual(["x"]);
  });

  it("rejects files that are not PromptDeck exports", () => {
    expect(importSchema.safeParse({ prompts: [] }).success).toBe(false);
  });
});
