import { getDb } from "@/db/client";
import { json, parseBody, route } from "@/lib/api";
import { createPromptSchema, listPromptsSchema } from "@/lib/validation";
import { createPrompt, listPrompts } from "@/services/prompts";

export const dynamic = "force-dynamic";

export const GET = route((request) => {
  const query = listPromptsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return json(listPrompts(getDb(), query));
});

export const POST = route(async (request) => {
  const input = await parseBody(request, createPromptSchema);
  return json(createPrompt(getDb(), input), 201);
});
