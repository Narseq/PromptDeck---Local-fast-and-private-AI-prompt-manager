import { getDb } from "@/db/client";
import { json, parseBody, route } from "@/lib/api";
import { createTagSchema } from "@/lib/validation";
import { createTag, listTags } from "@/services/tags";

export const dynamic = "force-dynamic";

export const GET = route(() => json(listTags(getDb())));

export const POST = route(async (request) => {
  const input = await parseBody(request, createTagSchema);
  return json(createTag(getDb(), input), 201);
});
