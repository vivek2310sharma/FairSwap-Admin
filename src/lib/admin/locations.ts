import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Bound both sides of the catalogue read; the caller supplies its guarded user client. */
export async function loadLocations(client: SupabaseClient<Database>, params: { q?: string; page?: string }) {
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = /^\d+$/.test(params.page ?? "") ? Math.min(1000, Math.max(1, Number(params.page))) : 1;
  let query = client.from("cities")
    .select("id,name,state,slug,is_active")
    .order("name").order("id");
  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  const result = await query.range((page - 1) * 25, page * 25);
  if (result.error || !result.data) throw new Error("Location data unavailable.");

  // Also get the count of localities for each city
  const citiesWithCount = await Promise.all(
    result.data.slice(0, 25).map(async (city) => {
      const countRes = await client.from("localities").select("id", { count: "exact", head: true }).eq("city_id", city.id);
      return { ...city, localities_count: countRes.count || 0 };
    })
  );

  return { cities: citiesWithCount, hasMore: result.data.length > 25, page, q };
}

export async function loadLocalities(client: SupabaseClient<Database>, cityId: string, params: { q?: string; page?: string }) {
  const q = (params.q ?? "").trim().slice(0, 100);
  const page = /^\d+$/.test(params.page ?? "") ? Math.min(1000, Math.max(1, Number(params.page))) : 1;

  const cityQuery = await client.from("cities").select("id,name,state,slug,is_active").eq("id", cityId).single();
  if (cityQuery.error || !cityQuery.data) throw new Error("City not found.");

  let query = client.from("localities")
    .select("id,city_id,name,slug,is_active,created_at", { count: "exact" })
    .eq("city_id", cityId)
    .order("name").order("id");

  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);

  const result = await query.range((page - 1) * 50, page * 50);
  if (result.error || !result.data) throw new Error("Locality data unavailable.");

  return {
    city: cityQuery.data,
    localities: result.data.slice(0, 50),
    hasMore: result.data.length > 50,
    total: result.count || 0,
    page,
    q
  };
}
