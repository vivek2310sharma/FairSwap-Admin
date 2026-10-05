import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const sdk = vi.hoisted(() => ({ create: vi.fn(), store: { getAll: vi.fn(), set: vi.fn() }, headers: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient: sdk.create }));
vi.mock("next/headers", () => ({ cookies: async () => sdk.store, headers: sdk.headers }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

import { TEST_SUPABASE_URL } from "@/lib/config";
import { readAuthConfig } from "@/lib/auth/runtime-config";
import { staffAccess, requireStaffAccess } from "@/lib/auth/guard";
import { authMutation } from "@/lib/auth/mutations";
import { sameOriginMutation, safeAdminRedirect } from "@/lib/auth/inputs";
import { createAdminClient, ADMIN_COOKIE_NAME, PRIVATE_CACHE, type AdminClient, type CookieAdapter } from "@/lib/supabase/client";
import { proxy } from "@/proxy";
import { GET } from "@/app/admin/access/route";
import { recheckAction, verifyAction, signInAction } from "@/app/auth/actions";
import MfaPage from "@/app/auth/mfa/page";
import AdminPage from "@/app/admin/page";

const userId = "11111111-1111-4111-8111-111111111111";
const factorId = "22222222-2222-4222-8222-222222222222";
const otherId = "33333333-3333-4333-8333-333333333333";
const origin = "https://admin-test.fairswap.in";
const host = "admin-test.fairswap.in";
function fixture() {
  const claims = { sub: userId, iss: `${TEST_SUPABASE_URL}/auth/v1`, role: "authenticated", aud: "authenticated", aal: "aal2", exp: Math.floor(Date.now() / 1000) + 300 };
  const user = { id: userId, email_confirmed_at: "2026-01-01T00:00:00Z", user_metadata: { role: "administrator", account_status: "active" } };
  const account = { data: { account_status: "active" }, error: null as unknown };
  const staff = { data: { role: "moderator" }, error: null as unknown };
  const query = vi.fn((table: string) => {
    const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: vi.fn(async () => table === "user_accounts" ? account : staff) };
    return chain;
  });
  const client = {
    from: query,
    rpc: vi.fn(async () => ({ data: true as unknown, error: null as unknown })),
    auth: {
      getClaims: vi.fn(async () => ({ data: { claims }, error: null as unknown })),
      getUser: vi.fn(async () => ({ data: { user: user as typeof user | null }, error: null as unknown })),
      getSession: vi.fn(async () => ({ data: { session: { user } }, error: null })),
      signInWithPassword: vi.fn(async () => ({ error: null as unknown })),
      signOut: vi.fn(async () => ({ error: null as unknown })),
      mfa: {
        listFactors: vi.fn(async () => ({ data: { all: [{ id: factorId, factor_type: "totp", status: "verified" }] }, error: null as unknown })),
        enroll: vi.fn(async () => ({ data: { type: "totp", id: factorId, totp: { secret: "ABCDEFGHIJKLMNOPQRSTUVWX", qr_code: "not-rendered" } }, error: null as unknown })),
        challengeAndVerify: vi.fn(async () => ({ error: null as unknown })),
      },
    },
  };
  return { client, claims, user, account, staff, typed: client as unknown as AdminClient };
}
let f: ReturnType<typeof fixture>;
const factory = () => Promise.resolve(f.typed);
function form(values: Record<string, string> = {}) { const result = new FormData(); Object.entries(values).forEach(([key, value]) => result.set(key, value)); return result; }
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", "test");
  vi.stubEnv("FAIRSWAP_SUPABASE_URL", TEST_SUPABASE_URL);
  vi.stubEnv("FAIRSWAP_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic_fixture_not_a_real_key");
  f = fixture(); sdk.create.mockReturnValue(f.typed);
  sdk.store.getAll.mockReturnValue([]);
  sdk.headers.mockResolvedValue(new Headers({ origin, host }));
});

describe("runtime configuration and request isolation", () => {
  it.each([
    [undefined, undefined, undefined], ["test", TEST_SUPABASE_URL, undefined],
    ["production", TEST_SUPABASE_URL, "sb_publishable_synthetic_fixture_not_a_real_key"],
    ["test", "https://wrong-project.supabase.co", "sb_publishable_synthetic_fixture_not_a_real_key"],
    ["test", "http://127.0.0.1:54321", "sb_publishable_synthetic_fixture_not_a_real_key"],
    ["test", TEST_SUPABASE_URL, "sb_secret_synthetic_do_not_use"],
    ["test", TEST_SUPABASE_URL, "malformed"],
  ])("rejects configuration before SDK construction (%s, %s)", async (env, url, key) => {
    vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", env); vi.stubEnv("FAIRSWAP_SUPABASE_URL", url); vi.stubEnv("FAIRSWAP_SUPABASE_PUBLISHABLE_KEY", key);
    expect(readAuthConfig()).toBeNull();
    expect(createAdminClient({ getAll: () => [], setAll: vi.fn() }, true)).toBeNull();
    expect(await requireStaffAccess()).toEqual({ allowed: false, reason: "configuration" });
    const build = vi.fn(factory);
    expect((await authMutation("enroll", form(), origin, host, build)).error).toBeDefined();
    expect(build).not.toHaveBeenCalled(); expect(sdk.create).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("revalidates configuration after an earlier valid request", async () => {
    expect((await staffAccess(f.typed, true)).allowed).toBe(true);
    vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", "production"); f.client.rpc.mockClear();
    expect(await staffAccess(f.typed, true)).toEqual({ allowed: false, reason: "configuration" });
    expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it("constructs a new client per call and filters Web cookies", () => {
    const adapter = { getAll: () => [{ name: "sb-web-auth-token", value: "forged" }, { name: `${ADMIN_COOKIE_NAME}.0`, value: "synthetic" }], setAll: vi.fn() };
    createAdminClient(adapter, true); createAdminClient(adapter, true);
    expect(sdk.create).toHaveBeenCalledTimes(2);
    expect(sdk.create.mock.calls[0][2].cookies.getAll()).toEqual([{ name: `${ADMIN_COOKIE_NAME}.0`, value: "synthetic" }]);
    const options = sdk.create.mock.calls[0][2].cookieOptions;
    expect(options).toMatchObject({ name: ADMIN_COOKIE_NAME, httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    expect(options.domain).toBeUndefined();
  });
});

describe("verified server guard", () => {
  it.each(["administrator", "moderator"])("allows active %s AAL2 with current policy", async (role) => {
    f.staff.data.role = role;
    expect(await staffAccess(f.typed, true)).toMatchObject({ allowed: true, userId, role, aal: "aal2" });
    expect(f.client.auth.getSession).not.toHaveBeenCalled();
    expect(f.client.from.mock.calls.map(([table]) => table)).toEqual(["user_accounts", "staff_roles"]);
    expect(f.client.from.mock.results[0].value.eq).toHaveBeenCalledWith("user_id", userId);
    expect(f.client.rpc).toHaveBeenCalledWith("has_current_policy_acceptance");
  });
  it.each(["support_agent", "content_editor", "user", "", "unexpected"])("rejects role %s despite forged user metadata", async (role) => {
    f.staff.data.role = role; expect((await staffAccess(f.typed, true)).allowed).toBe(false); expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it.each(["suspended", "deleted", "deletion_pending", "unknown"])("denies account %s", async (status) => {
    f.account.data.account_status = status; expect((await staffAccess(f.typed, true)).allowed).toBe(false);
  });
  it("rejects unverified/forged cookie identity without querying staff", async () => {
    f.client.auth.getClaims.mockResolvedValue({ data: null as never, error: new Error("synthetic") });
    expect(await staffAccess(f.typed, true)).toEqual({ allowed: false, reason: "sign-in" });
    expect(f.client.auth.getSession).not.toHaveBeenCalled(); expect(f.client.from).not.toHaveBeenCalled();
  });
  it("rejects Auth identity lookup failure", async () => {
    f.client.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("synthetic") });
    expect((await staffAccess(f.typed, true)).allowed).toBe(false); expect(f.client.from).not.toHaveBeenCalled();
  });
  it.each(["issuer", "subject", "expiration", "email", "audience", "jwt-role", "aal"])("rejects invalid verified identity field %s", async (field) => {
    if (field === "issuer") f.claims.iss = "https://wrong-project.supabase.co/auth/v1";
    if (field === "subject") f.claims.sub = otherId;
    if (field === "expiration") f.claims.exp = 1;
    if (field === "email") f.user.email_confirmed_at = "";
    if (field === "audience") f.claims.aud = "anon";
    if (field === "jwt-role") f.claims.role = "service_role";
    if (field === "aal") f.claims.aal = "malformed";
    expect((await staffAccess(f.typed, true)).allowed).toBe(false); expect(f.client.from).not.toHaveBeenCalled();
  });
  it("denies lookup errors and thrown diagnostics safely", async () => {
    f.account.error = new Error("sensitive synthetic diagnostic");
    expect(await staffAccess(f.typed, true)).toEqual({ allowed: false, reason: "verification-error" });
    f.client.from.mockImplementation(() => { throw new Error("sensitive synthetic diagnostic"); });
    expect(await staffAccess(f.typed, true)).toEqual({ allowed: false, reason: "verification-error" });
  });
  it("permits AAL1 bootstrap reading only self eligibility, never policy or staff data", async () => {
    f.claims.aal = "aal1";
    expect(await staffAccess(f.typed, false)).toMatchObject({ allowed: true, aal: "aal1" });
    expect(f.client.rpc).not.toHaveBeenCalled();
    expect(await staffAccess(f.typed, true)).toEqual({ allowed: false, reason: "mfa" });
  });
  it.each([false, null, "true", {}, 1])("distinguishes policy result %j", async (value) => {
    f.client.rpc.mockResolvedValue({ data: value, error: null });
    expect(await staffAccess(f.typed, true)).toEqual({ allowed: false, reason: value === false ? "policy-required" : "policy-error" });
  });
  it("denies both policy error and exception without leaking messages", async () => {
    f.client.rpc.mockResolvedValue({ data: true, error: new Error("sensitive") });
    expect(await staffAccess(f.typed, true)).toEqual({ allowed: false, reason: "policy-error" });
    f.client.rpc.mockRejectedValue(new Error("sensitive"));
    expect(await staffAccess(f.typed, true)).toEqual({ allowed: false, reason: "policy-error" });
  });
});

describe("POST mutations and MFA", () => {
  it.each([null, "https://evil.example", "null", "http://admin-test.fairswap.in"])("rejects origin %s before any client use", async (value) => {
    const construct = vi.fn(factory);
    expect((await authMutation("sign-in", form(), value, host, construct)).error).toBe("Request origin rejected.");
    expect(construct).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["https://evil.example", "//evil.example", "/admin/../evil", "/admin?next=//evil.example", "/admin\\evil", "%2f%2fevil"])("restricts redirects %s", (value) => { expect(safeAdminRedirect(value)).toBe("/admin"); });
  it("supports loopback development with same-origin protection", () => { expect(sameOriginMutation("http://127.0.0.1:3100", "127.0.0.1:3100")).toBe(true); });
  it("accepts an existing short password without signup rules, then uses MFA bootstrap", async () => {
    f.claims.aal = "aal1";
    const result = await authMutation("sign-in", form({ email: "staff@example.invalid", password: "x", next: "https://evil.example" }), origin, host, factory);
    expect(result).toEqual({ redirectTo: "/auth/mfa" });
    expect(f.client.auth.signInWithPassword).toHaveBeenCalledWith({ email: "staff@example.invalid", password: "x" });
    expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it("rejects invalid input and invalid credentials without exposing details", async () => {
    expect((await authMutation("sign-in", form({ email: "bad", password: "" }), origin, host, factory)).error).toBeDefined();
    expect(f.client.auth.signInWithPassword).not.toHaveBeenCalled();
    f.client.auth.signInWithPassword.mockResolvedValue({ error: new Error("secret password synthetic") });
    const result = await authMutation("sign-in", form({ email: "staff@example.invalid", password: "synthetic" }), origin, host, factory);
    expect(JSON.stringify(result)).not.toContain("synthetic");
  });
  it("denies direct enrollment for a nonstaff user", async () => {
    f.staff.data.role = "user"; f.claims.aal = "aal1";
    expect((await authMutation("enroll", form(), origin, host, factory)).error).toBeDefined();
    expect(f.client.auth.mfa.enroll).not.toHaveBeenCalled();
  });
  it("enrolls only by explicit mutation with no existing factors; never claims AAL2", async () => {
    f.claims.aal = "aal1"; f.client.auth.mfa.listFactors.mockResolvedValue({ data: { all: [] }, error: null });
    const result = await authMutation("enroll", form(), origin, host, factory);
    expect(result).toEqual({ enrollment: { factorId, secret: "ABCDEFGHIJKLMNOPQRSTUVWX" } });
    expect(result.redirectTo).toBeUndefined(); expect(f.client.auth.mfa.challengeAndVerify).not.toHaveBeenCalled();
  });
  it.each(["verified", "unverified"])("does not replace an existing %s factor", async (status) => {
    f.claims.aal = "aal1";
    f.client.auth.mfa.listFactors.mockResolvedValue({ data: { all: [{ id: factorId, factor_type: "totp", status }] }, error: null });
    expect((await authMutation("enroll", form(), origin, host, factory)).error).toBeDefined();
    expect(f.client.auth.mfa.enroll).not.toHaveBeenCalled();
  });
  it("failed challenge stays denied and cannot fall back to enrollment", async () => {
    f.claims.aal = "aal1"; f.client.auth.mfa.challengeAndVerify.mockResolvedValue({ error: new Error("sensitive") });
    expect((await authMutation("verify", form({ factorId, code: "123456" }), origin, host, factory)).redirectTo).toBeUndefined();
    expect(f.client.auth.mfa.enroll).not.toHaveBeenCalled();
  });
  it("successful-looking challenge without a verified AAL2 token remains denied", async () => {
    f.claims.aal = "aal1";
    expect((await authMutation("verify", form({ factorId, code: "123456" }), origin, host, factory)).redirectTo).toBeUndefined();
  });
  it("reverifies claims after successful MFA before redirecting", async () => {
    f.claims.aal = "aal1";
    f.client.auth.mfa.challengeAndVerify.mockImplementation(async () => { f.claims.aal = "aal2"; return { error: null }; });
    expect(await authMutation("verify", form({ factorId, code: "123456", next: "//evil.example" }), origin, host, factory)).toEqual({ redirectTo: "/admin" });
    expect(f.client.auth.getClaims).toHaveBeenCalledTimes(2);
  });
  it("rejects foreign factors and unverified-factor bypass when a verified factor exists", async () => {
    f.claims.aal = "aal1";
    f.client.auth.mfa.listFactors.mockResolvedValue({ data: { all: [{ id: factorId, factor_type: "totp", status: "verified" }, { id: otherId, factor_type: "totp", status: "unverified" }] }, error: null });
    expect((await authMutation("verify", form({ factorId: otherId, code: "123456" }), origin, host, factory)).error).toBeDefined();
    expect(f.client.auth.mfa.challengeAndVerify).not.toHaveBeenCalled();
  });
  it("targets local Admin signout explicitly", async () => {
    expect(await authMutation("sign-out", form(), origin, host, factory)).toEqual({ redirectTo: "/auth/sign-in" });
    expect(f.client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it("reports signout errors without false success", async () => {
    f.client.auth.signOut.mockResolvedValue({ error: new Error("sensitive") });
    expect((await authMutation("sign-out", form(), origin, host, factory)).redirectTo).toBeUndefined();
  });
});

describe("actual entry points and cookie propagation", () => {
  it("direct protected route invocation denies AAL1 and returns private responses", async () => {
    f.claims.aal = "aal1";
    const response = await GET();
    expect(response.status).toBe(403); expect(await response.json()).toEqual({ access: "denied" });
    expect(response.headers.get("cache-control")).toBe(PRIVATE_CACHE);
    expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it("direct protected route verifies identity and policy without navigation", async () => { expect((await GET()).status).toBe(200); expect(f.client.rpc).toHaveBeenCalled(); });
  it("direct protected action fails closed on policy errors", async () => {
    f.client.rpc.mockRejectedValue(new Error("synthetic sensitive"));
    const result = await recheckAction({}, form());
    expect(result.error).toBeDefined(); expect(JSON.stringify(result)).not.toContain("synthetic");
  });
  it("direct MFA action cannot grant access from a submitted role/AAL", async () => {
    f.claims.aal = "aal1"; f.staff.data.role = "support_agent";
    expect((await verifyAction({}, form({ factorId, code: "123456", role: "administrator", aal: "aal2" }))).error).toBeDefined();
    expect(f.client.auth.mfa.challengeAndVerify).not.toHaveBeenCalled();
  });
  it("page rendering never enrolls a factor or reads protected data at AAL1", async () => {
    f.claims.aal = "aal1"; f.client.auth.mfa.listFactors.mockResolvedValue({ data: { all: [] }, error: null });
    await MfaPage(); expect(f.client.auth.mfa.enroll).not.toHaveBeenCalled(); expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it("protected page blocks stale policy and rechecks it each invocation", async () => {
    f.client.rpc.mockResolvedValue({ data: false, error: null }); await AdminPage(); await AdminPage(); expect(f.client.rpc).toHaveBeenCalledTimes(2);
  });
  it("refresh cookies survive the proxy response and reach downstream requests", async () => {
    sdk.create.mockImplementation((_url, _key, options: { cookies: CookieAdapter }) => {
      return { auth: { getClaims: async () => { options.cookies.setAll([{ name: `${ADMIN_COOKIE_NAME}.0`, value: "synthetic-refreshed", options: { domain: ".fairswap.in" } }], { "Cache-Control": "private, no-store" }); return { data: null, error: null }; } } };
    });
    const request = new NextRequest(`${origin}/admin`);
    const response = await proxy(request);
    expect(request.cookies.get(`${ADMIN_COOKIE_NAME}.0`)?.value).toBe("synthetic-refreshed");
    expect(response.cookies.get(`${ADMIN_COOKIE_NAME}.0`)?.value).toBe("synthetic-refreshed");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).not.toContain("Domain=");
    expect(response.headers.get("cache-control")).toBe(PRIVATE_CACHE);
  });
  it("server-action refreshed cookies remain in the outgoing cookie store on redirect", async () => {
    sdk.create.mockImplementation((_url, _key, options: { cookies: CookieAdapter }) => {
      f.client.auth.signInWithPassword.mockImplementation(async () => {
        options.cookies.setAll([{ name: ADMIN_COOKIE_NAME, value: "synthetic-refreshed", options: {} }], {});
        return { error: null };
      }); return f.typed;
    });
    await expect(signInAction({}, form({ email: "staff@example.invalid", password: "x" }))).rejects.toThrow("REDIRECT:/admin");
    expect(sdk.store.set).toHaveBeenCalledWith(ADMIN_COOKIE_NAME, "synthetic-refreshed", expect.objectContaining({ httpOnly: true, secure: true }));
  });
});
