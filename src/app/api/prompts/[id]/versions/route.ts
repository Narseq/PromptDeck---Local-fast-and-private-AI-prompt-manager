import { getDb } from "@/db/client";
import { json, route } from "@/lib/api";
import { listVersions } from "@/services/prompts";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>((_request, { id }) => json(listVersions(getDb(), id)));
