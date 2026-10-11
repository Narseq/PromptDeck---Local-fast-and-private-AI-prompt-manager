import { getDb } from "@/db/client";
import { json, route } from "@/lib/api";
import { recordUse } from "@/services/prompts";

export const POST = route<{ id: string }>((_request, { id }) => json(recordUse(getDb(), id)));
