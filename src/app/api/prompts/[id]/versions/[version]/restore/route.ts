import { getDb } from "@/db/client";
import { json, route } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { restoreVersion } from "@/services/prompts";

export const POST = route<{ id: string; version: string }>((_request, { id, version }) => {
  const number = Number(version);
  if (!Number.isInteger(number) || number < 1) throw new AppError("Invalid version", 400);
  return json(restoreVersion(getDb(), id, number));
});
