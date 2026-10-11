import { getDb } from "@/db/client";
import { json, parseBody, route } from "@/lib/api";
import { updateTagSchema } from "@/lib/validation";
import { deleteTag, updateTag } from "@/services/tags";

type Params = { id: string };

export const PATCH = route<Params>(async (request, { id }) => {
  const input = await parseBody(request, updateTagSchema);
  return json(updateTag(getDb(), id, input));
});

export const DELETE = route<Params>((_request, { id }) => {
  deleteTag(getDb(), id);
  return new Response(null, { status: 204 });
});
