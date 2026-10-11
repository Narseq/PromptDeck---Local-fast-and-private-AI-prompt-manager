import { getDb } from "@/db/client";
import { json, route } from "@/lib/api";
import { duplicatePrompt } from "@/services/prompts";

export const POST = route<{ id: string }>((_request, { id }) =>
  json(duplicatePrompt(getDb(), id), 201),
);
