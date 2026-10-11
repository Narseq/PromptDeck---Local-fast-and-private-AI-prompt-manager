import { getDb } from "@/db/client";
import { json, parseBody, route } from "@/lib/api";
import { createCategorySchema } from "@/lib/validation";
import { createCategory, listCategories } from "@/services/categories";

export const dynamic = "force-dynamic";

export const GET = route(() => json(listCategories(getDb())));

export const POST = route(async (request) => {
  const input = await parseBody(request, createCategorySchema);
  return json(createCategory(getDb(), input), 201);
});
