import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { loadLocations } from "@/lib/admin/locations";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import { TEST_SUPABASE_URL } from "@/lib/config";

function fixture(data: unknown[] | null = [], error: unknown = null) {
  const query = { select: vi.fn(() => query), order: vi.fn(() => query), limit: vi.fn(() => query),
    ilike: vi.fn(() => query), range: vi.fn(async () => ({ data, error })) };
  const client = { from: vi.fn(() => query) };
  return { client: client as unknown as SupabaseClient<Database>, query, from: client.from };
}
describe("bounded location catalogue read", () => {
  it("sends distinct parent and nested limits through the installed SDK with intercepted transport", async () => {
    const transport = vi.fn<typeof fetch>(async () => new Response("[]", { headers: { "Content-Type": "application/json" } }));
    const client = createClient<Database>(TEST_SUPABASE_URL, "SYNTHETIC-NONSECRET", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: transport },
    });
    await loadLocations(client, { q: "FS TEST", page: "2" });
    expect(transport).toHaveBeenCalledTimes(1);
    const url = new URL(String(transport.mock.calls[0]?.[0]));
    expect(url.origin).toBe(TEST_SUPABASE_URL);
    expect(url.pathname).toBe("/rest/v1/cities");
    expect(url.searchParams.get("localities.limit")).toBe("25");
    expect(url.searchParams.get("offset")).toBe("25");
    expect(url.searchParams.get("limit")).toBe("26");
    expect(url.searchParams.get("name")).toBe("ilike.%FS TEST%");
  });
  it("bounds the parent and embedded child reads rather than loading the whole catalogue", async () => {
    const f = fixture();
    await loadLocations(f.client, {});
    expect(f.from).toHaveBeenCalledWith("cities");
    expect(f.query.select.mock.calls[0]).toEqual(["id,name,state,slug,is_active,localities(id,city_id,name,slug,is_active,created_at)"]);
    expect(f.query.limit).toHaveBeenCalledWith(25, { referencedTable: "localities" });
    expect(f.query.range).toHaveBeenCalledWith(0, 25);
    expect(f.query.order).toHaveBeenCalledWith("id", { referencedTable: "localities" });
  });
  it("retains a lookahead city for truthful next-page navigation", async () => {
    const f = fixture(Array.from({ length: 26 }, (_, id) => ({ id })));
    const result = await loadLocations(f.client, { page: "2" });
    expect(result.cities).toHaveLength(25);
    expect(result.hasMore).toBe(true);
    expect(f.query.range).toHaveBeenCalledWith(25, 50);
  });
  it.each(["-1", "1.5", "invalid", "0"])("bounds invalid page %s", async (page) => {
    const f = fixture();
    expect((await loadLocations(f.client, { page })).page).toBe(1);
    expect(f.query.range).toHaveBeenCalledWith(0, 25);
  });
  it("caps page and search length and treats wildcard input literally", async () => {
    const f = fixture();
    const result = await loadLocations(f.client, { q: " %_\\FS ", page: "9999999" });
    expect(f.query.ilike).toHaveBeenCalledWith("name", "%\\%\\_\\\\FS%");
    expect(result.page).toBe(1000);
    expect((await loadLocations(f.client, { q: "x".repeat(101) })).q).toHaveLength(100);
  });
  it("distinguishes an empty catalogue from a failed backend read without exposing its error", async () => {
    expect((await loadLocations(fixture().client, {})).hasMore).toBe(false);
    await expect(loadLocations(fixture(null, { message: "SYNTHETIC_PRIVATE_ERROR" }).client, {}))
      .rejects.toThrow("Test location data unavailable.");
  });
});
