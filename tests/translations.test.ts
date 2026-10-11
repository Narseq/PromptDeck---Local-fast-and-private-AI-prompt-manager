import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "@/db/client";
import { availableLanguages, localizePrompt } from "@/lib/localize";
import {
  createPromptSchema,
  importSchema,
  listPromptsSchema,
  updatePromptSchema,
} from "@/lib/validation";
import {
  createPrompt,
  duplicatePrompt,
  getPrompt,
  listPrompts,
  updatePrompt,
} from "@/services/prompts";
import { exportAll, importAll } from "@/services/transfer";

let db: Db;

const create = (overrides: Record<string, unknown> = {}) =>
  createPrompt(
    db,
    createPromptSchema.parse({
      title: "Hello",
      content: "Say hello to {{name}}",
      language: "en",
      translations: [
        { language: "pl", title: "Cześć", content: "Przywitaj {{name}}" },
        { language: "de", content: "Begrüße {{name}}" },
      ],
      ...overrides,
    }),
  );

beforeEach(() => {
  db = openDatabase(":memory:", { seedExamples: false });
});

describe("prompt translations", () => {
  it("stores the original language and translations", () => {
    const prompt = create();
    expect(prompt.language).toBe("en");
    expect(prompt.translations.map((t) => t.language)).toEqual(["de", "pl"]);
    expect(availableLanguages(prompt)).toEqual(["en", "de", "pl"]);
  });

  it("ignores empty texts and the original language among translations", () => {
    const prompt = create({
      translations: [
        { language: "en", content: "duplicate of the original" },
        { language: "pl", content: "   " },
        { language: "ru", content: "Привет" },
      ],
    });
    expect(prompt.translations.map((t) => t.language)).toEqual(["ru"]);
  });

  it("rejects repeated languages", () => {
    const result = createPromptSchema.safeParse({
      title: "x",
      content: "y",
      translations: [
        { language: "pl", content: "a" },
        { language: "pl", content: "b" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("replaces translations on update and leaves them alone when omitted", () => {
    const prompt = create();
    updatePrompt(db, prompt.id, updatePromptSchema.parse({ isFavorite: true }));
    expect(getPrompt(db, prompt.id).translations).toHaveLength(2);

    const updated = updatePrompt(
      db,
      prompt.id,
      updatePromptSchema.parse({ translations: [{ language: "ru", content: "Привет" }] }),
    );
    expect(updated.translations.map((t) => t.language)).toEqual(["ru"]);
  });

  it("drops the translation that becomes the original language", () => {
    const prompt = create();
    const updated = updatePrompt(db, prompt.id, updatePromptSchema.parse({ language: "pl" }));
    expect(updated.language).toBe("pl");
    expect(updated.translations.map((t) => t.language)).toEqual(["de"]);
  });

  it("finds prompts by text in a translation", () => {
    create();
    expect(listPrompts(db, listPromptsSchema.parse({ q: "Przywitaj" })).total).toBe(1);
    expect(listPrompts(db, listPromptsSchema.parse({ q: "nonexistent" })).total).toBe(0);
  });

  it("copies translations when duplicating", () => {
    const copy = duplicatePrompt(db, create().id);
    expect(copy.translations).toHaveLength(2);
  });

  it("round-trips through export and import", () => {
    create();
    const payload = importSchema.parse(JSON.parse(JSON.stringify(exportAll(db))));
    const target = openDatabase(":memory:", { seedExamples: false });
    importAll(target, payload);
    const [imported] = listPrompts(target, listPromptsSchema.parse({})).items;
    expect(imported?.translations.map((t) => t.language)).toEqual(["de", "pl"]);
  });

  it("accepts export files from before translations existed", () => {
    const parsed = importSchema.parse({
      app: "promptdeck",
      version: 1,
      prompts: [{ title: "Old", content: "Body" }],
    });
    expect(parsed.prompts[0]).toMatchObject({ language: "en", translations: [] });
  });
});

describe("localizePrompt", () => {
  it("returns the requested language and falls back to the original", () => {
    const prompt = create();
    expect(localizePrompt(prompt, "pl")).toMatchObject({
      language: "pl",
      title: "Cześć",
      content: "Przywitaj {{name}}",
    });
    // the German translation has no title, so the original title is reused
    expect(localizePrompt(prompt, "de").title).toBe("Hello");
    expect(localizePrompt(prompt, "ru")).toBe(prompt);
    expect(localizePrompt(prompt, "en")).toBe(prompt);
  });
});

describe("migration", () => {
  it("adds the language column to a database from an earlier version", () => {
    const dir = mkdtempSync(join(tmpdir(), "promptdeck-"));
    const file = join(dir, "old.db");
    try {
      const old = new Database(file);
      old.exec(`CREATE TABLE prompts (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '', categoryId TEXT, isFavorite INTEGER NOT NULL DEFAULT 0,
        isDeleted INTEGER NOT NULL DEFAULT 0, usageCount INTEGER NOT NULL DEFAULT 0,
        lastUsedAt TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
        INSERT INTO prompts (id, title, content, createdAt, updatedAt)
        VALUES ('p1', 'Legacy', 'Body', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');`);
      old.close();

      const upgraded = openDatabase(file, { seedExamples: false });
      expect(getPrompt(upgraded, "p1")).toMatchObject({
        title: "Legacy",
        language: "en",
        translations: [],
      });
      upgraded.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
