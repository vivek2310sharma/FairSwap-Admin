// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { TEST_SUPABASE_URL } from "@/lib/config";
import { createAdminClient, ADMIN_COOKIE_NAME, isAdminCookie, type CookieAdapter, type CookieWrite } from "@/lib/supabase/client";
import { createDiagnostics, diagnosticEventSchema, type DiagnosticEvent } from "@/lib/auth/diagnostics";

const key = "sb_publishable_synthetic_fixture_not_a_real_key";
const env = { NODE_ENV: "test" as const, FAIRSWAP_DEPLOYMENT_ENV: "test", FAIRSWAP_SUPABASE_URL: TEST_SUPABASE_URL, FAIRSWAP_SUPABASE_PUBLISHABLE_KEY: key, FAIRSWAP_AUTH_DIAGNOSTICS: "loopback" };
function jar() {
  const values = new Map([["sb-web-auth-token", "synthetic-web-untouched"]]);
  const writes: CookieWrite[] = [];
  const adapter: CookieAdapter = {
    getAll: () => [...values].map(([name, value]) => ({ name, value })),
    setAll: updates => updates.forEach(cookie => {
      writes.push(cookie);
      if (cookie.options.maxAge === 0) values.delete(cookie.name);
      else values.set(cookie.name, cookie.value);
    }),
  };
  return { values, writes, adapter };
}
function context(events: DiagnosticEvent[]) {
  return createDiagnostics("127.0.0.1:3102", "guard", false, { env, argv: ["node", "C:/synthetic/node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1"], sink: event => events.push(event) });
}
beforeEach(() => {
  Object.entries(env).forEach(([name, value]) => vi.stubEnv(name, value));
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("real pinned SSR adapter across synthetic requests", () => {
  it.each([false, true])("rotates cookies and isolates failed refresh with expired=%s", async expired => {
    const store = jar(), unrelated = jar();
    const firstEvents: DiagnosticEvent[] = [], secondEvents: DiagnosticEvent[] = [];
    const first = createAdminClient(store.adapter, true, context(firstEvents))!;
    const refreshURL = `${TEST_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`;
    const transport = vi.mocked(fetch);
    transport.mockImplementationOnce(async (input, init) => {
      expect(input).toBe(refreshURL); expect(init).toMatchObject({ method: "POST", redirect: "error", cache: "no-store" });
      return new Response(JSON.stringify({ access_token: "synthetic-access-one", refresh_token: "synthetic-refresh-two", expires_in: 3600, token_type: "bearer", user: { id: "11111111-1111-4111-8111-111111111111" } }), { status: 200, headers: { "Content-Type": "application/json", "X-Supabase-Api-Version": "2024-01-01" } });
    });
    const firstResult = await first.auth.refreshSession({ refresh_token: "synthetic-refresh-one" });
    expect(firstResult.error).toBeNull(); expect(transport).toHaveBeenCalledOnce();
    expect([...store.values.keys()].some(isAdminCookie)).toBe(true);
    expect(firstEvents.map(event => event.outcome)).toEqual(["attempt", "http-success", "sdk-success"]);
    for (const cookie of store.writes) {
      expect(cookie.name).toMatch(new RegExp(`^${ADMIN_COOKIE_NAME}(\\.\\d+)?$`));
      expect(cookie.options).toMatchObject({ path: "/", httpOnly: true, secure: true, sameSite: "lax" });
      expect(cookie.options.domain).toBeUndefined();
    }
    vi.setSystemTime(new Date("2026-01-01T00:00:01Z"));
    const second = createAdminClient(store.adapter, true, context(secondEvents))!;
    // getSession here checks only cookie-adapter continuity, never authorization.
    const retained = await second.auth.getSession();
    expect(retained.data.session?.refresh_token).toBe("synthetic-refresh-two");
    expect(transport).toHaveBeenCalledOnce(); expect(secondEvents).toEqual([]);
    transport.mockImplementationOnce(async (input, init) => {
      expect(input).toBe(refreshURL); expect(init).toMatchObject({ method: "POST", redirect: "error", cache: "no-store" });
      return new Response(JSON.stringify({ code: "refresh_token_not_found", msg: "synthetic-sensitive-error" }), { status: 400, headers: { "Content-Type": "application/json", "X-Supabase-Api-Version": "2024-01-01" } });
    });
    if (expired) vi.setSystemTime(new Date("2026-01-01T01:00:01Z"));
    const secondResult = await second.auth.refreshSession();
    expect(secondResult.error?.code).toBe("refresh_token_not_found");
    expect(transport).toHaveBeenCalledTimes(2);
    expect(secondEvents.map(event => event.outcome)).toEqual(["attempt", "http-error"]);
    expect(secondEvents.at(-1)?.status).toBe(400);
    expect([...store.values.keys()].some(isAdminCookie)).toBe(!expired);
    expect(store.writes.some(cookie => cookie.options.maxAge === 0)).toBe(expired);
    const third = createAdminClient(store.adapter, true)!;
    const finalSession = (await third.auth.getSession()).data.session;
    if (expired) expect(finalSession).toBeNull();
    else expect(finalSession?.refresh_token).toBe("synthetic-refresh-two");
    expect(transport).toHaveBeenCalledTimes(2);
    expect(store.values.get("sb-web-auth-token")).toBe("synthetic-web-untouched");
    expect(unrelated.values).toEqual(new Map([["sb-web-auth-token", "synthetic-web-untouched"]])); expect(unrelated.writes).toEqual([]);
    for (const event of [...firstEvents, ...secondEvents]) expect(diagnosticEventSchema.safeParse(event).success).toBe(true);
    expect(firstEvents[0].correlationId).not.toBe(secondEvents[0].correlationId);
    const serialized = JSON.stringify([...firstEvents, ...secondEvents]);
    for (const sentinel of [key, "synthetic-access-one", "synthetic-refresh", "synthetic-sensitive-error"]) expect(serialized).not.toContain(sentinel);
  });
});
