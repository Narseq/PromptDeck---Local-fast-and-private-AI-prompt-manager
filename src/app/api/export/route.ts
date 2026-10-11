import { getDb } from "@/db/client";
import { route } from "@/lib/api";
import { exportAll } from "@/services/transfer";

export const dynamic = "force-dynamic";

export const GET = route(() => {
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(exportAll(getDb()), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="promptdeck-export-${date}.json"`,
    },
  });
});
