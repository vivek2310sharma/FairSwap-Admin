import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
vi.mock("server-only", () => ({}));
import { testOnlyFetch } from "@/lib/supabase/client";
import { TEST_SUPABASE_URL } from "@/lib/config";

describe("fixed SDK transport and real token verifier", () => {
  it("blocks unexpected destinations before fetch", () => {
    for (const url of ["https://evil.example/auth/v1", "http://127.0.0.1:54321/auth/v1", `${TEST_SUPABASE_URL}.evil.example/auth/v1`]) {
      expect(() => testOnlyFetch(url)).toThrow("Backend destination rejected.");
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it("forces no-store and refuses HTTP redirects on the fixed Test origin", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}"));
    await testOnlyFetch(`${TEST_SUPABASE_URL}/auth/v1/user`);
    expect(fetch).toHaveBeenCalledWith(`${TEST_SUPABASE_URL}/auth/v1/user`, { redirect: "error", cache: "no-store" });
  });
  it("uses the real SDK to reject a forged JWT through a controlled transport", async () => {
    const transport = vi.fn(async () => new Response(JSON.stringify({ msg: "invalid JWT", code: "bad_jwt" }), { status: 401, headers: { "Content-Type": "application/json" } }));
    const client = createClient(TEST_SUPABASE_URL, "sb_publishable_synthetic_fixture_not_a_real_key", {
      global: { fetch: transport },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ iss: "https://evil.example/auth/v1", sub: "11111111-1111-4111-8111-111111111111", aal: "aal2", exp: Math.floor(Date.now() / 1000) + 300 })}.c3ludGhldGlj`;
    const result = await client.auth.getClaims(token);
    expect(result.error).toBeTruthy(); expect(result.data).toBeNull();
    expect(transport).toHaveBeenCalledWith(`${TEST_SUPABASE_URL}/auth/v1/user`, expect.any(Object));
    expect(fetch).not.toHaveBeenCalled();
  });
});


  it.each([TEST_SUPABASE_URL,"https://kriuhwppxgxsyyrbjsau.supabase.co"])("real SDK rejects a forged cross-project token for %s without fallback",async url => {
    const transport=vi.fn(async()=>new Response(JSON.stringify({msg:"invalid JWT",code:"bad_jwt"}),{status:401,headers:{"Content-Type":"application/json"}}));
    const client=createClient(url,"sb_publishable_synthetic_fixture_not_a_real_key",{global:{fetch:transport},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const encode=(v:unknown)=>btoa(JSON.stringify(v)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
    const other=url === TEST_SUPABASE_URL ? "https://kriuhwppxgxsyyrbjsau.supabase.co" : TEST_SUPABASE_URL;
    const token=encode({alg:"HS256",typ:"JWT"})+"."+encode({iss:other+"/auth/v1",sub:"11111111-1111-4111-8111-111111111111",aal:"aal2",exp:Math.floor(Date.now()/1000)+300})+".c3ludGhldGlj";
    const result=await client.auth.getClaims(token);expect(result.error).toBeTruthy();expect(result.data).toBeNull();
    expect(transport).toHaveBeenCalledWith(url+"/auth/v1/user",expect.any(Object));expect(fetch).not.toHaveBeenCalled();
  });
