import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({ create: vi.fn(), cookies: vi.fn(), headers: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient: sdk.create }));
vi.mock("next/headers", () => ({ cookies: sdk.cookies, headers: sdk.headers }));

import { TEST_SUPABASE_URL } from "@/lib/config";
import { staffAccess } from "@/lib/auth/guard";
import { authMutation } from "@/lib/auth/mutations";
import { createDiagnostics, diagnosticEventSchema, type DiagnosticEvent } from "@/lib/auth/diagnostics";
import { createAdminClient, ADMIN_COOKIE_NAME, PRIVATE_CACHE, type AdminClient, type CookieAdapter } from "@/lib/supabase/client";
import { GET } from "@/app/admin/access/route";

const key = "sb_publishable_synthetic_fixture_not_a_real_key";
const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const factorId = "33333333-3333-4333-8333-333333333333";
const env = { NODE_ENV: "test" as const, FAIRSWAP_DEPLOYMENT_ENV: "test", FAIRSWAP_SUPABASE_URL: TEST_SUPABASE_URL, FAIRSWAP_SUPABASE_PUBLISHABLE_KEY: key, FAIRSWAP_AUTH_DIAGNOSTICS: "loopback" };
function fixture(id = firstId) {
  const state = { account: "active", role: "moderator", policy: true, aal: "aal2" };
  const claims = { sub: id, iss: `${TEST_SUPABASE_URL}/auth/v1`, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 600 };
  const client = {
    auth: {
      getClaims: vi.fn(async () => ({ data: { claims: { ...claims, aal: state.aal } }, error: null })),
      getUser: vi.fn(async () => ({ data: { user: { id, email_confirmed_at: "2026-01-01T00:00:00Z" } }, error: null })),
      onAuthStateChange: vi.fn(),
      mfa: {
        listFactors: vi.fn<() => Promise<{ data: { all: unknown } | null; error: unknown }>>(async () => ({ data: { all: [{ id: factorId, factor_type: "totp", status: "verified" }] }, error: null })),
        challengeAndVerify: vi.fn(async () => ({ error: null })),
        enroll: vi.fn(),
      },
    },
    from: vi.fn((table: string) => {
      const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: vi.fn(async () => ({ data: table === "user_accounts" ? { account_status: state.account } : { role: state.role }, error: null })) };
      return chain;
    }),
    rpc: vi.fn(async () => ({ data: state.policy, error: null })),
  };
  return { state, client, typed: client as unknown as AdminClient };
}
function diagnostics(events: DiagnosticEvent[]) {
  return createDiagnostics("127.0.0.1:3102", "guard", false, { env, argv: ["node", "C:/synthetic/node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1"], sink: event => events.push(event) });
}
beforeEach(() => {
  vi.clearAllMocks();
  Object.entries(env).forEach(([name, value]) => vi.stubEnv(name, value));
  // Real request-client diagnostics remain off; explicit contexts above use synthetic runtime inputs.
  vi.stubEnv("FAIRSWAP_AUTH_DIAGNOSTICS", "");
  sdk.cookies.mockResolvedValue({ getAll: () => [], set: vi.fn() });
  sdk.headers.mockResolvedValue(new Headers({ host: "127.0.0.1:3102" }));
});
afterEach(() => vi.restoreAllMocks());

describe("offline request isolation and fresh authorization", () => {
  it("interleaved clients isolate cookie writes, guard outcomes and diagnostic groups", async () => {
    const left = fixture(firstId), right = fixture(secondId);
    right.state.aal = "aal1";
    const leftEvents: DiagnosticEvent[] = [], rightEvents: DiagnosticEvent[] = [];
    const leftWrite = vi.fn(), rightWrite = vi.fn();
    const cookies = (value: string, setAll: CookieAdapter["setAll"]): CookieAdapter => ({ getAll: () => [{ name: ADMIN_COOKIE_NAME, value }, { name: "sb-web-auth-token", value: "synthetic-web" }], setAll });
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    sdk.create.mockImplementationOnce((_url, _key, options: { cookies: CookieAdapter }) => {
      const original = left.client.auth.getClaims;
      left.client.auth.getClaims = vi.fn(async () => {
        await held;
        expect(options.cookies.getAll()).toEqual([{ name: ADMIN_COOKIE_NAME, value: "synthetic-left" }]);
        options.cookies.setAll([{ name: ADMIN_COOKIE_NAME, value: "synthetic-left-new", options: { domain: ".example.invalid" } }, { name: "sb-web-auth-token", value: "synthetic-rejected", options: {} }], {});
        return original();
      });
      return left.typed;
    }).mockImplementationOnce((_url, _key, options: { cookies: CookieAdapter }) => {
      const original = right.client.auth.getClaims;
      right.client.auth.getClaims = vi.fn(async () => {
        expect(options.cookies.getAll()).toEqual([{ name: ADMIN_COOKIE_NAME, value: "synthetic-right" }]);
        options.cookies.setAll([{ name: ADMIN_COOKIE_NAME, value: "synthetic-right-new", options: {} }], {});
        return original();
      });
      return right.typed;
    });
    const a = createAdminClient(cookies("synthetic-left", leftWrite), false, diagnostics(leftEvents))!;
    const b = createAdminClient(cookies("synthetic-right", rightWrite), true, diagnostics(rightEvents))!;
    const pending = staffAccess(a, true);
    try {
      expect(await staffAccess(b, true)).toEqual({ allowed: false, reason: "mfa" });
      expect(leftWrite).not.toHaveBeenCalled();
      expect(right.client.rpc).not.toHaveBeenCalled();
    } finally { release(); }
    expect(await pending).toMatchObject({ allowed: true, userId: firstId, aal: "aal2" });
    expect(leftWrite).toHaveBeenCalledExactlyOnceWith([{ name: ADMIN_COOKIE_NAME, value: "synthetic-left-new", options: { path: "/", httpOnly: true, sameSite: "lax", secure: false } }], {});
    expect(rightWrite).toHaveBeenCalledExactlyOnceWith([{ name: ADMIN_COOKIE_NAME, value: "synthetic-right-new", options: { path: "/", httpOnly: true, sameSite: "lax", secure: true } }], {});
    expect(left.client.rpc).toHaveBeenCalledExactlyOnceWith("has_current_policy_acceptance");
    expect(leftEvents.at(-1)).toMatchObject({ stage: "final", outcome: "ok" });
    expect(rightEvents.at(-1)).toMatchObject({ stage: "final", outcome: "denied" });
    const leftGroups = new Set(leftEvents.map(event => event.correlationId));
    const rightGroups = new Set(rightEvents.map(event => event.correlationId));
    expect(leftGroups.size).toBe(1); expect(rightGroups.size).toBe(1);
    expect([...leftGroups].some(id => rightGroups.has(id))).toBe(false);
    for (const event of [...leftEvents, ...rightEvents]) expect(diagnosticEventSchema.safeParse(event).success).toBe(true);
    const serialized = JSON.stringify([...leftEvents, ...rightEvents]);
    for (const sentinel of [firstId, secondId, key, "synthetic-left", "synthetic-right", "synthetic-web"]) expect(serialized).not.toContain(sentinel);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["account", "role", "policy"] as const)("direct route discards a prior allow when fresh %s changes", async change => {
    const before = fixture(), after = fixture();
    if (change === "account") after.state.account = "suspended";
    if (change === "role") after.state.role = "support_agent";
    if (change === "policy") after.state.policy = false;
    sdk.create.mockReturnValueOnce(before.typed).mockReturnValueOnce(after.typed);
    const first = await GET(), second = await GET();
    expect(first.status).toBe(200); expect(await first.json()).toEqual({ access: "confirmed" });
    expect(second.status).toBe(403); expect(await second.json()).toEqual({ access: "denied" });
    for (const response of [first, second]) expect(response.headers.get("cache-control")).toBe(PRIVATE_CACHE);
    expect(sdk.create).toHaveBeenCalledTimes(2);
    for (const f of [before, after]) {
      expect(f.client.auth.getClaims).toHaveBeenCalledOnce(); expect(f.client.auth.getUser).toHaveBeenCalledOnce();
      expect(f.client.from.mock.calls.map(([table]) => table)).toEqual(["user_accounts", "staff_roles"]);
      for (const result of f.client.from.mock.results) expect(result.value.eq).toHaveBeenCalledWith("user_id", firstId);
    }
    expect(before.client.rpc).toHaveBeenCalledOnce();
    expect(after.client.rpc).toHaveBeenCalledTimes(change === "policy" ? 1 : 0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["empty", "missing", "malformed", "error"])("MFA verification refuses %s factor lookup without enrollment fallback", async kind => {
    const f = fixture(); f.state.aal = "aal1";
    const result = kind === "empty" ? { data: { all: [] }, error: null } : kind === "missing" ? { data: null, error: null } : kind === "malformed" ? { data: { all: [{ id: factorId, factor_type: "totp", status: "unexpected" }] }, error: null } : { data: { all: [] }, error: new Error("synthetic-sensitive-error") };
    f.client.auth.mfa.listFactors.mockResolvedValue(result);
    const form = new FormData(); form.set("factorId", factorId); form.set("code", "123456");
    const outcome = await authMutation("verify", form, "http://127.0.0.1:3102", "127.0.0.1:3102", async () => f.typed);
    expect(outcome.error).toBeDefined(); expect(outcome.redirectTo).toBeUndefined(); expect(outcome.enrollment).toBeUndefined();
    expect(f.client.auth.mfa.listFactors).toHaveBeenCalledOnce();
    expect(f.client.auth.mfa.challengeAndVerify).not.toHaveBeenCalled(); expect(f.client.auth.mfa.enroll).not.toHaveBeenCalled();
    expect(f.client.rpc).not.toHaveBeenCalled(); expect(JSON.stringify(outcome)).not.toContain("synthetic-sensitive-error");
    expect(fetch).not.toHaveBeenCalled();
  });
});
