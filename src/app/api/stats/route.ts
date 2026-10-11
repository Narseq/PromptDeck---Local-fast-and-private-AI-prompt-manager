import { getDb } from "@/db/client";
import { json, route } from "@/lib/api";
import { getStats } from "@/services/prompts";

export const dynamic = "force-dynamic";

export const GET = route(() => json(getStats(getDb())));
