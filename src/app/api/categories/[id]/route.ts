import { getDb } from "@/db/client";
import { route } from "@/lib/api";
import { deleteCategory } from "@/services/categories";

export const DELETE = route<{ id: string }>((_request, { id }) => {
  deleteCategory(getDb(), id);
  return new Response(null, { status: 204 });
});
