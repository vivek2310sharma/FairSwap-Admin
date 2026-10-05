import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const requestSDK = vi.hoisted(() => ({ create: vi.fn(), store: { getAll: vi.fn(), set: vi.fn() }, headers: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient: requestSDK.create }));
vi.mock("next/headers", () => ({ cookies: async () => requestSDK.store, headers: requestSDK.headers }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

import { createDiagnostics, requestDiagnostics, attachDiagnostics, diagnosticEventSchema, safeErrorMetadata, type DiagnosticEvent } from "@/lib/auth/diagnostics";
import { staffAccess } from "@/lib/auth/guard";
import { observeRefresh, createAdminClient, ADMIN_COOKIE_NAME, PRIVATE_CACHE, type AdminClient, type CookieAdapter } from "@/lib/supabase/client";
import { proxy } from "@/proxy";
import { GET } from "@/app/admin/access/route";
import AdminPage from "@/app/admin/page";
import { signInAction } from "@/app/auth/actions";
import { TEST_SUPABASE_URL } from "@/lib/config";

const SENTINEL = "SENSITIVE_SENTINEL_never_emit";
const argv = ["node", "C:/fixture/node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1"];
const environment = { NODE_ENV: "production" as const, FAIRSWAP_AUTH_DIAGNOSTICS: "loopback", FAIRSWAP_DEPLOYMENT_ENV: "test", FAIRSWAP_SUPABASE_URL: TEST_SUPABASE_URL,
  FAIRSWAP_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_fixture_not_a_real_key" };
const initialArgv = process.argv;
function context(events: DiagnosticEvent[], changes: Partial<NodeJS.ProcessEnv> = {}) {
  return createDiagnostics("127.0.0.1:3102", "guard", false, { argv, env: { ...environment, ...changes }, sink: (event) => events.push(event) });
}
function fixture(kind = "allowed") {
  const id = "11111111-1111-4111-8111-111111111111";
  const claims = { sub: id, iss: `${TEST_SUPABASE_URL}/auth/v1`, aud: "authenticated", role: "authenticated", aal: kind === "mfa" ? "aal1" : "aal2", exp: Math.floor(Date.now() / 1000) + 600, nested: SENTINEL };
  const user = { id, email: SENTINEL, email_confirmed_at: "2026-01-01T00:00:00Z" };
  const error = { code: "session_not_found", status: 401, message: SENTINEL, stack: SENTINEL, cause: { secret: SENTINEL } };
  const account = { data: { account_status: kind === "inactive" ? "suspended" : "active" }, error: kind === "account-error" ? error : null };
  const role = { data: { role: kind === "role-denied" ? "support_agent" : "moderator" }, error: kind === "role-error" ? error : null };
  const queries: { table: string; select: unknown; eq: unknown }[] = [];
  const client = {
    auth: {
      getClaims: vi.fn(async () => {
        if (kind === "claims-throw") throw error;
        return { data: kind === "claims-missing" ? null : { claims }, error: kind === "claims-error" ? error : null };
      }),
      getUser: vi.fn(async () => {
        if (kind === "user-throw") throw error;
        return { data: { user: kind === "user-missing" ? null : user }, error: kind === "user-error" ? error : null };
      }),
      onAuthStateChange: vi.fn(), signInWithPassword: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn((table: string) => {
      const query = { table, select: undefined as unknown, eq: undefined as unknown }; queries.push(query);
      const chain = { select: vi.fn((value: unknown) => { query.select = value; return chain; }), eq: vi.fn((...value: unknown[]) => { query.eq = value; return chain; }), maybeSingle: vi.fn(async () => {
        if (kind === `${table === "user_accounts" ? "account" : "role"}-throw`) throw error;
        return table === "user_accounts" ? account : role;
      }) };
      return chain;
    }),
    rpc: vi.fn(async () => {
      if (kind === "policy-throw") throw error;
      return { data: kind === "policy-required" ? false : kind === "policy-malformed" ? { sensitive: SENTINEL } : true, error: kind === "policy-error" ? error : null };
    }),
  };
  if (kind === "invalid-claims") claims.iss = "https://wrong-project.supabase.co/auth/v1";
  if (kind === "unconfirmed") user.email_confirmed_at = "";
  return { client, typed: client as unknown as AdminClient, queries, counts: () => ({ claims: client.auth.getClaims.mock.calls, user: client.auth.getUser.mock.calls, from: client.from.mock.calls, rpc: client.rpc.mock.calls, queries }) };
}
beforeEach(() => {
  vi.clearAllMocks();
  Object.entries(environment).forEach(([key, value]) => vi.stubEnv(key, value));
  vi.stubEnv("CI", undefined); vi.stubEnv("VERCEL", undefined); vi.stubEnv("VERCEL_ENV", undefined);
  process.argv = argv;
  requestSDK.store.getAll.mockReturnValue([]);
  requestSDK.headers.mockResolvedValue(new Headers({ host: "127.0.0.1:3102", origin: "http://127.0.0.1:3102" }));
  requestSDK.create.mockReturnValue(fixture().typed);
});
afterEach(() => { process.argv = initialArgv; vi.restoreAllMocks(); });

describe("local server-owned activation", () => {
  it("emits nothing by default, despite incoming diagnostic inputs", () => {
    vi.stubEnv("FAIRSWAP_AUTH_DIAGNOSTICS", undefined);
    const sink = vi.spyOn(console, "info");
    const headers = new Headers({ "x-auth-diagnostics": "loopback", cookie: "diagnostics=loopback", host: "127.0.0.1:3102" });
    const diagnostic = requestDiagnostics("127.0.0.1:3102", "guard", headers);
    diagnostic.emit("claims", "error", { code: SENTINEL });
    expect(diagnostic.enabled).toBe(false); expect(sink).not.toHaveBeenCalled();
  });
  it.each(["VERCEL", "VERCEL_ENV", "CI", "AWS_LAMBDA_FUNCTION_NAME", "K_SERVICE", "WEBSITE_INSTANCE_ID", "NETLIFY", "CF_PAGES", "FLY_APP_NAME", "RENDER", "RAILWAY_ENVIRONMENT", "DENO_DEPLOYMENT_ID"])("blocks hosted marker %s", (key) => {
    const events: DiagnosticEvent[] = []; expect(context(events, { [key]: "1" }).enabled).toBe(false); expect(events).toEqual([]);
  });
  it.each(["example.com", "127.0.0.1.evil.example", "0.0.0.0", "127.0.0.2", "localhost@evil", "127.0.0.1:12/secret"])("blocks non-loopback host %s", (host) => {
    expect(createDiagnostics(host, "guard", false, { argv, env: environment }).enabled).toBe(false);
  });
  it.each([
    { FAIRSWAP_DEPLOYMENT_ENV: "production" }, { FAIRSWAP_SUPABASE_URL: "https://wrong-project.supabase.co" },
    { FAIRSWAP_AUTH_DIAGNOSTICS: "true" }, { FAIRSWAP_SUPABASE_PUBLISHABLE_KEY: undefined },
  ])("blocks invalid server configuration %j", (changes) => { expect(context([], changes).enabled).toBe(false); });
  it.each([
    { launch: ["node", "script"] }, { launch: [...argv.slice(0, 3)] }, { launch: [...argv.slice(0, 4), "0.0.0.0"] }, { launch: [...argv, "--hostname", "127.0.0.1"] },
  ])("does not trust Host without explicit Next loopback binding %j", ({ launch }) => {
    expect(createDiagnostics("127.0.0.1", "guard", false, { argv: launch, env: environment }).enabled).toBe(false);
  });
  it("supports local production-mode builds without using NODE_ENV as authorization", () => {
    const events: DiagnosticEvent[] = [];
    expect(context(events, { NODE_ENV: "production" }).enabled).toBe(true);
    expect(context(events, { NODE_ENV: "production", FAIRSWAP_AUTH_DIAGNOSTICS: undefined }).enabled).toBe(false);
  });
  it.each([new Headers({ "x-forwarded-for": "198.51.100.1" }), new Headers({ "forwarded": "host=127.0.0.1" }), new Headers({ "x-forwarded-host": "evil.example" })])("blocks nonlocal forwarding", (headers) => {
    expect(requestDiagnostics("127.0.0.1:3102", "guard", headers).enabled).toBe(false);
  });
  it("accepts Next's loopback forwarding but ignores diagnostic headers", () => {
    expect(requestDiagnostics("127.0.0.1:3102", "guard", new Headers({ "x-forwarded-for": "127.0.0.1", "x-forwarded-host": "127.0.0.1:3102", "x-diagnostic-id": SENTINEL })).enabled).toBe(true);
  });
});

describe("constructed schema and error safety", () => {
  it("constructs only exact permitted fields, never arbitrary properties", () => {
    const events: DiagnosticEvent[] = []; const diagnostic = context(events);
    diagnostic.emit("claims", "error", { code: "bad_jwt", status: 401, message: SENTINEL, stack: SENTINEL, headers: { authorization: SENTINEL }, body: SENTINEL, claims: SENTINEL, userId: SENTINEL });
    expect(events).toHaveLength(1); expect(diagnosticEventSchema.parse(events[0])).toEqual(events[0]);
    expect(Object.keys(events[0]).sort()).toEqual(["timestamp", "group", "correlationId", "stage", "outcome", "category", "status", "fixture"].sort());
    expect(events[0]).toMatchObject({ category: "bad_jwt", status: 401, fixture: "UNKNOWN" });
    expect(JSON.stringify(events)).not.toContain(SENTINEL);
  });
  it.each([undefined, null, SENTINEL, { code: SENTINEL, status: SENTINEL }, { name: "AuthApiError", message: SENTINEL }, { code: { nested: SENTINEL }, status: 999 }])("unknown errors never pass arbitrary strings (%j)", (error) => {
    const events: DiagnosticEvent[] = []; context(events).emit("identity", "error", error, "unclassified");
    expect(events[0].category).toBe("unclassified"); expect(JSON.stringify(events)).not.toContain(SENTINEL);
  });
  it("does not invoke throwing accessors or traverse cyclic objects", () => {
    const error: Record<string, unknown> = { message: SENTINEL }; error.cycle = error;
    const accessor = vi.fn(() => { throw new Error(SENTINEL); });
    Object.defineProperty(error, "code", { get: accessor }); Object.defineProperty(error, "status", { get: accessor });
    expect(safeErrorMetadata(error)).toEqual({ category: "unclassified", status: undefined }); expect(accessor).not.toHaveBeenCalled();
    const proxyError = new Proxy({}, { getOwnPropertyDescriptor: accessor });
    expect(() => context([]).emit("claims", "exception", proxyError)).not.toThrow();
  });
  it("bounds each event group and cannot share correlation/fixture identity", async () => {
    const left: DiagnosticEvent[] = [], right: DiagnosticEvent[] = []; const a = context(left), b = context(right);
    await Promise.all([Promise.resolve().then(() => { for (let i = 0; i < 100; i++) a.emit("claims", "ok"); }), Promise.resolve().then(() => b.emit("identity", "ok"))]);
    expect(left).toHaveLength(32); expect(right).toHaveLength(1);
    expect(left[0].correlationId).not.toBe(right[0].correlationId); expect(left.every((event) => event.fixture === "UNKNOWN")).toBe(true);
  });
  it("schema failure and throwing sink never escape", () => {
    const diagnostic = createDiagnostics("127.0.0.1", "guard", false, { argv, env: environment, sink: () => { throw new Error(SENTINEL); } });
    expect(() => diagnostic.emit("claims", "ok")).not.toThrow();
    vi.spyOn(diagnosticEventSchema, "safeParse").mockImplementation(() => { throw new Error(SENTINEL); });
    expect(() => diagnostic.emit("claims", "ok")).not.toThrow();
  });
  it("malformed event primitives cannot emit arbitrary values", () => {
    const events: DiagnosticEvent[] = []; const diagnostic = context(events);
    diagnostic.emit(SENTINEL as never, "ok");
    diagnostic.emit("claims", SENTINEL as never);
    diagnostic.emit("claims", "ok", undefined, SENTINEL as never);
    diagnostic.emit("claims", "ok", undefined, "none", SENTINEL as never);
    expect(events).toEqual([]);
  });
});

describe("guard and entry-point parity", () => {
  it.each(["allowed", "claims-error", "claims-missing", "claims-throw", "invalid-claims", "user-error", "user-missing", "user-throw", "unconfirmed", "account-error", "account-throw", "role-error", "role-throw", "inactive", "role-denied", "mfa", "policy-required", "policy-malformed", "policy-error", "policy-throw"])("preserves result/order/SDK-query arguments for %s", async (kind) => {
    const off = fixture(kind), on = fixture(kind); const events: DiagnosticEvent[] = [];
    attachDiagnostics(on.typed, context(events));
    expect(await staffAccess(on.typed, true)).toEqual(await staffAccess(off.typed, true));
    expect(on.counts()).toEqual(off.counts());
    expect(events.at(-1)?.stage).toBe("final"); expect(JSON.stringify(events)).not.toContain(SENTINEL);
    expect(events.some((event) => event.stage === "refresh")).toBe(false); expect(fetch).not.toHaveBeenCalled();
  });
  it("sink/parser failures do not change guard success or early denial", async () => {
    vi.spyOn(diagnosticEventSchema, "safeParse").mockImplementation(() => { throw new Error(SENTINEL); });
    for (const kind of ["allowed", "claims-error", "policy-required"]) {
      const on = fixture(kind), off = fixture(kind); attachDiagnostics(on.typed, context([]));
      expect(await staffAccess(on.typed, true)).toEqual(await staffAccess(off.typed, true)); expect(on.counts()).toEqual(off.counts());
    }
  });
  it("throwing SDK result accessors do not change original query ordering", async () => {
    function accessorFixture() {
      const f = fixture();
      f.client.from.mockImplementation((table: string) => {
        const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: vi.fn(async () => {
          if (table === "user_accounts") return Object.defineProperty({ data: { account_status: "active" } }, "error", { get() { throw new Error(SENTINEL); } }) as never;
          return { data: { role: "moderator" }, error: null } as never;
        }) }; return chain;
      }); return f;
    }
    const on = accessorFixture(), off = accessorFixture(); attachDiagnostics(on.typed, context([]));
    expect(await staffAccess(on.typed, true)).toEqual(await staffAccess(off.typed, true));
    expect(on.client.from.mock.calls).toEqual(off.client.from.mock.calls);
    expect(on.client.from.mock.calls.map(([table]) => table)).toEqual(["user_accounts", "staff_roles"]);
  });
  it.each(["allowed", "mfa", "policy-required", "claims-error"])("public endpoint is identical with diagnostics on/off for %s", async (kind) => {
    const sink = vi.spyOn(console, "info").mockImplementation(() => {});
    const off = fixture(kind); requestSDK.create.mockReturnValue(off.typed); vi.stubEnv("FAIRSWAP_AUTH_DIAGNOSTICS", undefined);
    const offResponse = await GET(); const offBody = await offResponse.json();
    vi.stubEnv("FAIRSWAP_AUTH_DIAGNOSTICS", "loopback"); const on = fixture(kind); requestSDK.create.mockReturnValue(on.typed);
    const response = await GET();
    expect(response.status).toBe(offResponse.status); expect(await response.json()).toEqual(offBody);
    expect(response.headers.get("cache-control")).toBe(PRIVATE_CACHE); expect(on.counts()).toEqual(off.counts());
    expect(JSON.stringify(sink.mock.calls)).not.toContain(SENTINEL);
  });
  it("redirects and server-action cookie writes survive a failing sink", async () => {
    vi.spyOn(console, "info").mockImplementation(() => { throw new Error(SENTINEL); });
    requestSDK.create.mockReturnValue(fixture("mfa").typed);
    await expect(AdminPage()).rejects.toThrow("REDIRECT:/auth/mfa");
    requestSDK.create.mockImplementation((_url, _key, options: { cookies: CookieAdapter }) => {
      const f = fixture(); f.client.auth.signInWithPassword.mockImplementation(async () => { options.cookies.setAll([{ name: ADMIN_COOKIE_NAME, value: SENTINEL, options: {} }], {}); return { error: null }; }); return f.typed;
    });
    const form = new FormData(); form.set("email", "fixture@example.invalid"); form.set("password", SENTINEL);
    await expect(signInAction({}, form)).rejects.toThrow("REDIRECT:/admin");
    expect(requestSDK.store.set).toHaveBeenCalledWith(ADMIN_COOKIE_NAME, SENTINEL, expect.objectContaining({ httpOnly: true, secure: false, sameSite: "lax", path: "/" }));
  });
  it.each(["returned", "thrown", "ok"])("proxy preserves cookies/cache and safely observes getClaims %s", async (kind) => {
    const sink = vi.spyOn(console, "info").mockImplementation(() => {});
    requestSDK.create.mockImplementation((_url, _key, options: { cookies: CookieAdapter }) => ({ auth: { getClaims: async () => {
      options.cookies.setAll([{ name: `${ADMIN_COOKIE_NAME}.0`, value: SENTINEL, options: { domain: ".example.invalid" } }], {});
      const error = { status: 401, code: "session_not_found", message: SENTINEL };
      if (kind === "thrown") throw error;
      return { data: kind === "ok" ? { claims: { secret: SENTINEL } } : null, error: kind === "returned" ? error : null };
    } } }));
    const request = new NextRequest("http://127.0.0.1:3102/admin?diagnostics=true", { headers: { "x-diagnostic-id": SENTINEL } });
    const response = await proxy(request);
    expect(request.cookies.get(`${ADMIN_COOKIE_NAME}.0`)?.value).toBe(SENTINEL); expect(response.cookies.get(`${ADMIN_COOKIE_NAME}.0`)?.value).toBe(SENTINEL);
    expect(response.headers.get("cache-control")).toBe(PRIVATE_CACHE); expect(response.headers.get("set-cookie")).not.toContain("Domain=");
    const events = sink.mock.calls.map((call) => JSON.parse(call[1] as string) as DiagnosticEvent);
    expect(events.at(-1)).toMatchObject({ group: "proxy", stage: "proxy-claims", outcome: kind === "returned" ? "error" : kind === "thrown" ? "exception" : "ok" });
    expect(events.some((event) => event.stage === "refresh")).toBe(false); expect(JSON.stringify(events)).not.toContain(SENTINEL);
  });
  it("proxy sink failure cannot prevent downstream cookie propagation", async () => {
    vi.spyOn(console, "info").mockImplementation(() => { throw new Error(SENTINEL); });
    requestSDK.create.mockImplementation((_url, _key, options: { cookies: CookieAdapter }) => ({ auth: { getClaims: async () => { options.cookies.setAll([{ name: ADMIN_COOKIE_NAME, value: SENTINEL, options: {} }], {}); return { data: null, error: { code: "bad_jwt", status: 401 } }; } } }));
    const response = await proxy(new NextRequest("http://127.0.0.1:3102/admin"));
    expect(response.cookies.get(ADMIN_COOKIE_NAME)?.value).toBe(SENTINEL); expect(response.headers.get("cache-control")).toBe(PRIVATE_CACHE);
  });
  it("proxy query/header/cookie inputs cannot activate diagnostics without opt-in", async () => {
    vi.stubEnv("FAIRSWAP_AUTH_DIAGNOSTICS", undefined);
    const sink = vi.spyOn(console, "info");
    await proxy(new NextRequest("http://127.0.0.1:3102/admin?FAIRSWAP_AUTH_DIAGNOSTICS=loopback", { headers: { "x-auth-diagnostics": "loopback", cookie: "FAIRSWAP_AUTH_DIAGNOSTICS=loopback" } }));
    expect(sink).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("client construction exceptions retain existing failure behavior", async () => {
    vi.spyOn(console, "info").mockImplementation(() => { throw new Error(SENTINEL); });
    const error = new Error(SENTINEL); requestSDK.create.mockImplementation(() => { throw error; });
    expect(createAdminClient.bind(null, { getAll: () => [], setAll: vi.fn() }, false, context([]))).toThrow(error);
    const response = await GET(); expect(response.status).toBe(403); expect(await response.json()).toEqual({ access: "denied" });
    expect(response.headers.get("cache-control")).toBe(PRIVATE_CACHE);
  });
});

describe("actual refresh transport and real pinned SDK", () => {
  it("does not label claims/user/password requests or SDK events alone as refresh", async () => {
    const events: DiagnosticEvent[] = []; const observer = observeRefresh(context(events));
    vi.mocked(fetch).mockResolvedValue(new Response("{}"));
    await observer.transport(`${TEST_SUPABASE_URL}/auth/v1/user`);
    await observer.transport(`${TEST_SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST" });
    observer.sdkEvent("TOKEN_REFRESHED"); expect(events).toEqual([]);
  });
  it("keeps request/cancellation semantics and returns the identical unconsumed response", async () => {
    const events: DiagnosticEvent[] = []; const observer = observeRefresh(context(events));
    const response = new Response(JSON.stringify({ code: "refresh_token_already_used", msg: SENTINEL }), { status: 400 });
    vi.mocked(fetch).mockResolvedValue(response);
    const controller = new AbortController(); const options = { method: "POST", body: SENTINEL, headers: { apikey: SENTINEL }, signal: controller.signal };
    expect(await observer.transport(`${TEST_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, options)).toBe(response);
    expect(response.bodyUsed).toBe(false); expect(await response.json()).toEqual({ code: "refresh_token_already_used", msg: SENTINEL });
    expect(fetch).toHaveBeenCalledOnce(); expect(fetch).toHaveBeenCalledWith(expect.any(String), { ...options, redirect: "error", cache: "no-store" });
    expect(events.map((event) => event.outcome)).toEqual(["attempt", "http-error"]); expect(events[1]).toMatchObject({ status: 400, category: "code-unavailable" });
    expect(JSON.stringify(events)).not.toContain(SENTINEL);
  });
  it("preserves a transport exception identity and emits unclassified without retry", async () => {
    const error = new Error(SENTINEL); vi.mocked(fetch).mockRejectedValue(error);
    const events: DiagnosticEvent[] = []; const observer = observeRefresh(context(events));
    await expect(observer.transport(`${TEST_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST" })).rejects.toBe(error);
    expect(fetch).toHaveBeenCalledOnce(); expect(events.at(-1)).toMatchObject({ outcome: "exception", category: "unclassified" });
    expect(JSON.stringify(events)).not.toContain(SENTINEL);
  });
  it("response metadata accessor failures still return the original response", async () => {
    const events: DiagnosticEvent[] = []; const observer = observeRefresh(context(events));
    const response = new Response("usable"); Object.defineProperty(response, "status", { get() { throw new Error(SENTINEL); } });
    vi.mocked(fetch).mockResolvedValue(response);
    expect(await observer.transport(`${TEST_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST" })).toBe(response);
    expect(await response.text()).toBe("usable"); expect(events.at(-1)?.category).toBe("unclassified"); expect(JSON.stringify(events)).not.toContain(SENTINEL);
  });
  it.each([true, false])("real SDK refresh %s distinguishes HTTP from SDK outcome without leaking session data", async (success) => {
    const events: DiagnosticEvent[] = []; const observer = observeRefresh(context(events));
    const payload = success ? { access_token: "synthetic-access", refresh_token: SENTINEL, expires_in: 3600, token_type: "bearer", user: { id: SENTINEL, email: SENTINEL } } : { code: "refresh_token_already_used", msg: SENTINEL };
    vi.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify(payload), { status: success ? 200 : 400, headers: { "Content-Type": "application/json", "X-Supabase-Api-Version": "2024-01-01" } }));
    const client = createClient(TEST_SUPABASE_URL, environment.FAIRSWAP_SUPABASE_PUBLISHABLE_KEY, { global: { fetch: observer.transport }, auth: { storageKey: `synthetic-refresh-${success}`, persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const subscription = client.auth.onAuthStateChange((event) => observer.sdkEvent(event));
    const result = await client.auth.refreshSession({ refresh_token: SENTINEL });
    if (result.error) context(events).emit("claims", "error", result.error);
    expect(!!result.error).toBe(!success); expect(fetch).toHaveBeenCalledOnce();
    expect(events.filter((event) => event.outcome === "sdk-success")).toHaveLength(success ? 1 : 0);
    if (!success) expect(events.at(-1)?.category).toBe("refresh_token_already_used");
    expect(JSON.stringify(events)).not.toContain(SENTINEL); subscription.data.subscription.unsubscribe();
  });
  it("concurrent clients keep refresh observation and groups separate", async () => {
    const a: DiagnosticEvent[] = [], b: DiagnosticEvent[] = []; const left = observeRefresh(context(a)), right = observeRefresh(context(b));
    vi.mocked(fetch).mockImplementation(async () => new Response("{}"));
    await Promise.all([left.transport(`${TEST_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST" }), right.transport(`${TEST_SUPABASE_URL}/auth/v1/user`)]);
    right.sdkEvent("TOKEN_REFRESHED"); expect(b).toEqual([]); left.sdkEvent("TOKEN_REFRESHED"); expect(a.at(-1)?.outcome).toBe("sdk-success");
  });
  it("client observer registration failure preserves SDK construction", () => {
    const f = fixture(); f.client.auth.onAuthStateChange.mockImplementation(() => { throw new Error(SENTINEL); }); requestSDK.create.mockReturnValue(f.typed);
    expect(createAdminClient({ getAll: () => [], setAll: vi.fn() }, false, context([]))).toBe(f.typed);
    expect(requestSDK.create).toHaveBeenCalledOnce(); expect(fetch).not.toHaveBeenCalled();
  });
});
