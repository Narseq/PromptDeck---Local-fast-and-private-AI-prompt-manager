import { getDb } from "@/db/client";
import { route } from "@/lib/api";
import { promptToMarkdown, promptToText, toFileName } from "@/lib/export-format";
import { localizePrompt } from "@/lib/localize";
import { exportFormatSchema, languageSchema } from "@/lib/validation";
import { getPrompt } from "@/services/prompts";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>((request, { id }) => {
  const format = exportFormatSchema.parse(new URL(request.url).searchParams.get("format") ?? "md");
  const lang = new URL(request.url).searchParams.get("lang");
  const stored = getPrompt(getDb(), id);
  const prompt = lang ? localizePrompt(stored, languageSchema.parse(lang)) : stored;
  const body = format === "md" ? promptToMarkdown(prompt) : promptToText(prompt);
  return new Response(body, {
    headers: {
      "Content-Type": `${format === "md" ? "text/markdown" : "text/plain"}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${toFileName(prompt.title)}.${format}"`,
    },
  });
});
