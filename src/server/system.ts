import { getDb } from "@/db/client";
import * as schema from "@/db/schema";

export type SystemFlags = { salesPaused: boolean; killSwitch: boolean };

/** Read the global sales pause and kill switch from system state. */
export async function getSystemFlags(): Promise<SystemFlags> {
  const db = await getDb();
  const rows = await db.select().from(schema.appMeta);
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    salesPaused: map.get("sales_paused") === "true",
    killSwitch: map.get("kill_switch") === "true",
  };
}