import { describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign, webcrypto } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
vi.mock("server-only", () => ({}));
import { staffAccess } from "@/lib/auth/guard";
import type { AdminClient } from "@/lib/supabase/client";
import { ENVIRONMENTS } from "@/lib/config";

// Real SDK asymmetric verification with synthetic JWKS, keys and transport.
// No Supabase endpoint, customer token or environment file is contacted/read.
describe("real signature plus selected issuer boundary", () => {
  it.each(["test", "production"] as const)("rejects a correctly signed other-project issuer in %s", async environment => {
    const selected = ENVIRONMENTS[environment];
    vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", environment);
    vi.stubEnv("FAIRSWAP_SUPABASE_URL", selected.url);
    vi.stubEnv("FAIRSWAP_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic_fixture_not_a_real_key");
    vi.stubEnv("FAIRSWAP_ADMIN_RELEASE_STATE", "active");
    vi.stubGlobal("crypto", webcrypto);
    const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const jwk = { ...publicKey.export({ format: "jwk" }), kid: "synthetic-only", alg: "ES256", use: "sig" };
    const encode = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
    const subject = "11111111-1111-4111-8111-111111111111";
    const transport = vi.fn(async (input: string | URL | Request) => {
      expect(String(input)).toBe(selected.url + "/auth/v1/.well-known/jwks.json");
      return new Response(JSON.stringify({ keys: [jwk] }), { headers: { "Content-Type": "application/json" } });
    });
    const sdk = createClient(selected.url, "sb_publishable_synthetic_fixture_not_a_real_key", {
      global: { fetch: transport }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const db = vi.fn((table: string) => {
      const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: table === "staff_roles" ? {role: "administrator"} : {account_status: "active"}, error: null }) };
      return chain;
    });
    for (const issuer of [ENVIRONMENTS[environment === "test" ? "production" : "test"].url, selected.url]) {
      const input = encode({alg: "ES256",typ: "JWT",kid: jwk.kid}) + "." + encode({sub:subject,iss:issuer+"/auth/v1",aud:"authenticated",role:"authenticated",aal:"aal2",exp:Math.floor(Date.now()/1000)+300});
      const token = input + "." + sign("sha256", Buffer.from(input), {key:privateKey,dsaEncoding:"ieee-p1363"}).toString("base64url");
      const verified = await sdk.auth.getClaims(token);
      expect(verified.error).toBeNull(); // Signature is valid: issuer is a separate application obligation.
      const client = {auth:{getClaims:()=>sdk.auth.getClaims(token),getUser:async()=>({data:{user:{id:subject,email_confirmed_at:"2026-01-01T00:00:00Z"}},error:null})},from:db,rpc:async()=>({data:true,error:null})} as unknown as AdminClient;
      const access = await staffAccess(client,true);
      expect(access.allowed).toBe(issuer === selected.url);
      if(issuer !== selected.url) expect(db).not.toHaveBeenCalled();
    }
    expect(transport).toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
});
