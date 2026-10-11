import { describe, expect, it } from "vitest";
import { promptToMarkdown, promptToText, toFileName } from "@/lib/export-format";
import type { Prompt } from "@/lib/types";

const prompt: Prompt = {
  id: "1",
  title: "Code review: Ąę!",
  content: "Review {{code}}",
  description: "Short",
  categoryId: "c",
  categoryName: "Coding",
  tags: [{ id: "t", name: "review", color: "#fff000" }],
  isFavorite: false,
  language: "en",
  translations: [],
  isDeleted: false,
  usageCount: 0,
  lastUsedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("export formats", () => {
  it("builds a safe file name", () => {
    expect(toFileName("Code review: Ąę!")).toBe("code-review-ae");
    expect(toFileName("???")).toBe("prompt");
  });

  it("renders markdown with metadata and content", () => {
    const markdown = promptToMarkdown(prompt);
    expect(markdown).toContain("# Code review: Ąę!");
    expect(markdown).toContain("**Category:** Coding");
    expect(markdown).toContain("**Tags:** review");
    expect(markdown).toContain("```text\nReview {{code}}\n```");
  });

  it("renders plain text as the raw content", () => {
    expect(promptToText(prompt)).toBe("Review {{code}}\n");
  });
});
