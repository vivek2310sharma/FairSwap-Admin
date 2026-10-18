import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { loadLocations, loadLocalities } from "@/lib/admin/locations";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createClient } from "@supabase/supabase-js";
import { TEST_SUPABASE_URL } from "@/lib/config";

function fixture(data: unknown[] | null = [], error: unknown = null) {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    ilike: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(async () => ({ data: { id: "test", name: "test", state: "test", slug: "test", is_active: true } as unknown, error: null as unknown })),
    range: vi.fn(async () => ({ data, error, count: 100 }))
  };
  const client = { from: vi.fn(() => query) };
  return { client: client as unknown as SupabaseClient<Database>, query, from: client.from };
}

describe("bounded location catalogue read", () => {
  it("sends limits through the installed SDK with intercepted transport", async () => {
    const transport = vi.fn<typeof fetch>(async () => new Response("[]", { headers: { "Content-Type": "application/json" } }));
    const client = createClient<Database>(TEST_SUPABASE_URL, "SYNTHETIC-NONSECRET", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: transport },
    });

    try {
        await loadLocations(client, { q: "FS TEST", page: "2" });
    } catch {
        // We expect this to fail parsing the empty array Response during mapping
    }

    expect(transport).toHaveBeenCalledTimes(1);
    const url = new URL(String(transport.mock.calls[0]?.[0]));
    expect(url.origin).toBe(TEST_SUPABASE_URL);
    expect(url.pathname).toBe("/rest/v1/cities");
    expect(url.searchParams.get("offset")).toBe("25");
    expect(url.searchParams.get("limit")).toBe("26");
    expect(url.searchParams.get("name")).toBe("ilike.%FS TEST%");
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
      .rejects.toThrow("Location data unavailable.");
  });
});

describe("loadLocalities", () => {
    it("bounds the locality reads and maintains lookahead", async () => {
        const f = fixture(Array.from({ length: 51 }, (_, id) => ({ id })));
        const result = await loadLocalities(f.client, "city-id", { page: "1" });
        expect(result.localities).toHaveLength(50);
        expect(result.hasMore).toBe(true);
        expect(f.query.range).toHaveBeenCalledWith(0, 50);
    });

    it("advances past the first 50 correctly", async () => {
        const f = fixture(Array.from({ length: 2 }, (_, id) => ({ id })));
        const result = await loadLocalities(f.client, "city-id", { page: "2" });
        expect(result.localities).toHaveLength(2);
        expect(result.hasMore).toBe(false);
        expect(f.query.range).toHaveBeenCalledWith(50, 100);
    });

    it("filters localities based on search query", async () => {
        const f = fixture([]);
        await loadLocalities(f.client, "city-id", { q: "Locality" });
        expect(f.query.ilike).toHaveBeenCalledWith("name", "%Locality%");
    });

    it("throws City not found for an empty city response", async () => {
        const f = fixture([]);
        f.query.single.mockResolvedValueOnce({ data: null as unknown, error: { message: "Row not found", details: "", hint: "", code: "" } as unknown });
        await expect(loadLocalities(f.client, "city-id", {})).rejects.toThrow("City not found.");
    });
});
