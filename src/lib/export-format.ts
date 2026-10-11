import type { Prompt } from "./types";

/** Safe file name stem derived from a prompt title. */
export function toFileName(title: string): string {
  const stem = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return stem || "prompt";
}

export function promptToMarkdown(prompt: Prompt): string {
  const lines = [`# ${prompt.title}`, ""];
  const meta: string[] = [];
  if (prompt.categoryName) meta.push(`**Category:** ${prompt.categoryName}`);
  if (prompt.tags.length > 0) meta.push(`**Tags:** ${prompt.tags.map((t) => t.name).join(", ")}`);
  if (meta.length > 0) lines.push(meta.join("  \n"), "");
  if (prompt.description) lines.push(`> ${prompt.description.replace(/\n+/g, " ")}`, "");
  lines.push("```text", prompt.content, "```", "");
  return lines.join("\n");
}

export function promptToText(prompt: Prompt): string {
  return `${prompt.content}\n`;
}
