import { getDb } from "@/db/client";
import { json, parseBody, route } from "@/lib/api";
import { importSchema } from "@/lib/validation";
import { importAll } from "@/services/transfer";

export const POST = route(async (request) => {
  const payload = await parseBody(request, importSchema);
  return json(importAll(getDb(), payload));
});
