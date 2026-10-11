import { getDb } from "@/db/client";
import { json, parseBody, route } from "@/lib/api";
import { updatePromptSchema } from "@/lib/validation";
import { deletePermanently, getPrompt, moveToTrash, updatePrompt } from "@/services/prompts";

export const dynamic = "force-dynamic";

type Params = { id: string };

export const GET = route<Params>((_request, { id }) => json(getPrompt(getDb(), id)));

export const PATCH = route<Params>(async (request, { id }) => {
  const input = await parseBody(request, updatePromptSchema);
  return json(updatePrompt(getDb(), id, input));
});

/** Moves a prompt to trash; with ?permanent=true deletes a trashed prompt for good. */
export const DELETE = route<Params>((request, { id }) => {
  const permanent = new URL(request.url).searchParams.get("permanent") === "true";
  if (permanent) deletePermanently(getDb(), id);
  else moveToTrash(getDb(), id);
  return new Response(null, { status: 204 });
});
