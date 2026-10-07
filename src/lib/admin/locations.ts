import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Bound both sides of the catalogue read; the caller supplies its guarded user client. */
export async function loadLocations(client: SupabaseClient<Database>, params: { q?: string; page?: string }) {
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = /^\d+$/.test(params.page ?? "") ? Math.min(1000, Math.max(1, Number(params.page))) : 1;
  let query = client.from("cities")
    .select("id,name,state,slug,is_active,localities(id,city_id,name,slug,is_active,created_at)")
    .order("name").order("id")
    .order("name", { referencedTable: "localities" }).order("id", { referencedTable: "localities" })
    .limit(25, { referencedTable: "localities" });
  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  const result = await query.range((page - 1) * 25, page * 25);
  if (result.error || !result.data) throw new Error("Test location data unavailable.");
  return { cities: result.data.slice(0, 25), hasMore: result.data.length > 25, page, q };
}
