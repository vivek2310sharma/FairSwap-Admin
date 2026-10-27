import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const request = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requestClient: request.client }));
import { adminMutation } from "@/lib/admin/mutations";
import { releaseAllows } from "@/lib/admin/release-policy";
import { ratingsEnabled } from "@/lib/admin/ratings/feature";
import { loadRatingsQueue } from "@/lib/admin/ratings/server";
import { availableActions, evidenceSchema, queueSchema, reasonSchema } from "@/lib/admin/ratings/contract";
import { TEST_SUPABASE_URL } from "@/lib/config";
import type { AdminClient } from "@/lib/supabase/client";
import { actor, at, caseId, evidenceFixture, otherId, queueFixture, ticketId } from "./ratings-fixtures";

const origin = "http://127.0.0.1:3000";
const host = "127.0.0.1:3000";
const input = { operation: "ratings", target: "case", id: caseId, action: "evidence", reason: "Synthetic investigation reason" };
function fixture() {
  const claims = { sub: actor, iss: `${TEST_SUPABASE_URL}/auth/v1`, aud: "authenticated", role: "authenticated", aal: "aal2", exp: Math.floor(Date.now() / 1000) + 300 };
  const rows = { role: "moderator", status: "active", policy: true };
  let outcome: { data: unknown; error: { code: string; message?: string } | null } | undefined;
  const retry = vi.fn();
  const client = {
    auth: { getClaims: vi.fn(async () => ({ data: { claims }, error: null })), getUser: vi.fn(async () => ({ data: { user: { id: actor, email_confirmed_at: at } }, error: null })) },
    from: vi.fn((table: string) => {
      if (!["user_accounts", "staff_roles"].includes(table)) throw new Error("Private Ratings table read");
      const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: vi.fn(async () => ({ data: table === "user_accounts" ? { account_status: rows.status } : { role: rows.role }, error: null })) };
      return chain;
    }),
    rpc: vi.fn((name: string, args?: Record<string, unknown>) => {
      const response = name === "has_current_policy_acceptance" ? { data: rows.policy, error: null } : outcome ?? {
        data: name === "admin_ratings_cases" ? queueFixture() : args?.action === "evidence" ? evidenceFixture() : { case_id: caseId, action: args?.action }, error: null,
      };
      const promise = Promise.resolve(response);
      return Object.assign(promise, { retry: (enabled: boolean) => { retry(enabled); return promise; } });
    }),
  };
  return { client, rows, claims, retry, setOutcome: (value: typeof outcome) => { outcome = value; }, typed: client as unknown as AdminClient };
}
let f: ReturnType<typeof fixture>;
const factory = vi.fn(async () => f.typed);
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", "test"); vi.stubEnv("FAIRSWAP_SUPABASE_URL", TEST_SUPABASE_URL);
  vi.stubEnv("FAIRSWAP_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic_fixture_not_a_real_key");
  vi.stubEnv("FAIRSWAP_ADMIN_RATINGS_TEST_ENABLED", "true");
  f = fixture(); request.client.mockImplementation(factory);
});

describe("Ratings guarded RPC adapter", () => {
  it("defaults each environment flag off and isolates Test from Production", async () => {
    vi.stubEnv("FAIRSWAP_ADMIN_RATINGS_TEST_ENABLED", "");
    vi.stubEnv("FAIRSWAP_ADMIN_RATINGS_PRODUCTION_ENABLED", "true");
    expect(ratingsEnabled()).toBe(false);
    expect((await adminMutation(input, origin, host, factory)).error).toMatch(/unavailable/);
    expect((await loadRatingsQueue({})).error).toMatch(/unavailable/);
    expect(factory).not.toHaveBeenCalled();
    vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", "production");
    // Wrong backend configuration also fails closed, even with a flag set.
    expect(ratingsEnabled()).toBe(false);
  });
  it.each(["support_agent", "content_editor", "customer"])("denies role %s without Ratings calls", async role => {
    f.rows.role = role;
    expect((await adminMutation(input, origin, host, factory)).error).toMatch(/access denied/);
    expect((await loadRatingsQueue({})).error).toMatch(/access denied/);
    expect(f.client.rpc.mock.calls.every(([name]) => name === "has_current_policy_acceptance")).toBe(true);
  });
  it.each(["aal1", "missing-policy", "suspended"])("denies %s before evidence", async failure => {
    if (failure === "aal1") f.claims.aal = "aal1";
    if (failure === "missing-policy") f.rows.policy = false;
    if (failure === "suspended") f.rows.status = "suspended";
    expect((await adminMutation(input, origin, host, factory)).error).toMatch(/access denied/);
    expect((await loadRatingsQueue({})).error).toMatch(/access denied/);
    expect(f.client.rpc.mock.calls.some(([name]) => name.startsWith("admin_ratings"))).toBe(false);
  });
  it.each([null, "https://foreign.invalid", `${origin}/path`])("rejects origin %s before session access", async bad => {
    expect((await adminMutation(input, bad, host, factory)).error).toMatch(/origin/);
    expect(factory).not.toHaveBeenCalled();
  });
  it.each([undefined, null, "", "ab", "\tReason", "<reason>", "a\u202ereason", "x".repeat(501)])("rejects invalid reason %j", async reason => {
    expect((await adminMutation({ ...input, reason }, origin, host, factory)).error).toBeTruthy();
    expect(factory).not.toHaveBeenCalled();
  });
  it("validates NFC Unicode codepoints rather than UTF16 units", () => {
    expect(reasonSchema.parse("  e\u0301😀x  ")).toBe("é😀x");
    expect(reasonSchema.safeParse("😀".repeat(500)).success).toBe(true);
    expect(reasonSchema.safeParse("😀".repeat(501)).success).toBe(false);
  });
  it.each(["PGRST202", "42883", "55000"])("fails closed for unavailable backend %s", async code => {
    f.setOutcome({ data: null, error: { code, message: "Do not reflect private errors" } });
    expect((await adminMutation(input, origin, host, factory)).error).toMatch(/unavailable/);
    expect((await loadRatingsQueue({})).error).toMatch(/unavailable/);
  });
  it.each(["hide", "restore", "resolve", "void", "exclude", "clear_exclusion"])("sends exact %s mutation once, validates acknowledgement and disables SDK retries", async action => {
    const result = await adminMutation({ ...input, action }, origin, host, factory);
    expect(result).toMatchObject({ success: true }); expect(result.evidence).toBeUndefined();
    expect(f.client.rpc).toHaveBeenCalledWith("admin_ratings_case", { case_id: caseId, action, reason: input.reason });
    expect(f.client.rpc.mock.calls.filter(([name]) => name === "admin_ratings_case")).toHaveLength(1);
    expect(f.retry).toHaveBeenCalledWith(false); expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["42501", "22023", "23505", "PT409", "40001", "40P01", "55P03", "500"])("handles conflict/stale/uncertain %s without replay or raw error disclosure", async code => {
    f.setOutcome({ data: null, error: { code, message: "Synthetic private error" } });
    const result = await adminMutation({ ...input, action: "resolve" }, origin, host, factory);
    expect(result.success).toBeUndefined(); expect(result.error).toBeTruthy(); expect(JSON.stringify(result)).not.toContain("Synthetic private error");
    expect(f.client.rpc.mock.calls.filter(([name]) => name === "admin_ratings_case")).toHaveLength(1);
  });
  it("returns evidence only for explicit audited retrieval with exact arguments", async () => {
    expect((await adminMutation(input, origin, host, factory)).evidence).toEqual(evidenceFixture());
    expect(f.client.rpc).toHaveBeenCalledWith("admin_ratings_case", { case_id: caseId, action: "evidence", reason: input.reason });
  });
  it("supports linked ticket evidence and every moderation action via the exact ticket RPC", async () => {
    for (const action of ["evidence", "hide", "restore", "resolve", "void", "exclude", "clear_exclusion"]) {
      expect((await adminMutation({ ...input, target: "ticket", id: ticketId, action }, origin, host, factory)).success).toBe(true);
      expect(f.client.rpc).toHaveBeenCalledWith("admin_ratings_ticket", { ticket_id: ticketId, action, reason: input.reason });
    }
  });
  it.each(["seller_id", "buyer_id", "reporter_id"])("withholds own-case %s even if backend returned it incorrectly", async key => {
    const evidence = evidenceFixture();
    if (key === "reporter_id") evidence.case.reporter_id = actor;
    else if (key === "seller_id") evidence.trade.seller_id = actor;
    else evidence.trade.buyer_id = actor;
    f.setOutcome({ data: evidence, error: null });
    const result = await adminMutation(input, origin, host, factory);
    expect(result.error).toMatch(/own trades/); expect(result.evidence).toBeUndefined();
  });
  it("rejects malformed, foreign case/ticket and mismatched trade/review evidence", async () => {
    for (const data of [{ ...evidenceFixture(), extra: "private" }, { ...evidenceFixture(), case: { ...evidenceFixture().case, id: otherId } },
      { ...evidenceFixture(), trade: { ...evidenceFixture().trade, id: otherId } }]) {
      f.setOutcome({ data, error: null });
      expect((await adminMutation(input, origin, host, factory)).evidence).toBeUndefined();
    }
    f.setOutcome({ data: { ...evidenceFixture(), case: { ...evidenceFixture().case, support_ticket_id: otherId } }, error: null });
    expect((await adminMutation({ ...input, target: "ticket", id: ticketId }, origin, host, factory)).success).toBeUndefined();
  });
  it.each([{ case_id: otherId, action: "hide" }, { case_id: caseId, action: "restore" }, { case_id: caseId, action: "hide", unexpected: true }, null])("rejects invalid or mismatched acknowledgement %j", async data => {
    f.setOutcome({ data, error: null });
    expect((await adminMutation({ ...input, action: "hide" }, origin, host, factory)).success).toBeUndefined();
  });
});

describe("metadata-only queues and contextual presentation", () => {
  it.each(["review_report", "dispute"])("loads %s without evidence calls or sensitive metadata", async kind => {
    const page = queueFixture(); page.items[0].kind = kind as "review_report";
    f.setOutcome({ data: page, error: null });
    const result = await loadRatingsQueue({ kind, status: "all" });
    expect(result.queue?.items).toHaveLength(1);
    expect(f.client.rpc).toHaveBeenCalledWith("admin_ratings_cases", { kind, status: "all", before_at: null, before_id: null });
    expect(f.client.rpc.mock.calls.some(([name]) => ["admin_ratings_case", "admin_ratings_ticket"].includes(name))).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/Synthetic sealed|reporter_id|reason|risk_excluded/);
  });
  it("passes both cursor fields unchanged, uses fixed 20 rows and rejects oversized/leaky envelopes", async () => {
    const page = { items: Array.from({ length: 20 }, (_, index) => ({ ...queueFixture().items[0], id: `22222222-2222-4222-8222-${String(index).padStart(12, "0")}` })), has_more: true, next_cursor: null as { before_at: string; before_id: string } | null };
    const last = page.items.at(-1)!;
    page.next_cursor = { before_at: at, before_id: last.id };
    f.setOutcome({ data: page, error: null });
    expect((await loadRatingsQueue({ before_at: at, before_id: caseId })).queue?.items).toHaveLength(20);
    expect(f.client.rpc).toHaveBeenCalledWith("admin_ratings_cases", { kind: "review_report", status: "open", before_at: at, before_id: caseId });
    expect(queueSchema.safeParse({ ...page, items: [...page.items, { ...last, id: otherId }] }).success).toBe(false);
    expect(queueSchema.safeParse({ ...page, next_cursor: null }).success).toBe(false);
    expect(queueSchema.safeParse({ ...queueFixture(), items: [{ ...last, reason: "private" }] }).success).toBe(false);
  });
  it.each([{ before_at: at }, { before_id: caseId }, { kind: "fake" }, { status: "closed" }, { before_at: "bad", before_id: caseId }])("rejects invalid query %j", async query => {
    expect((await loadRatingsQueue(query)).error).toMatch(/Invalid/); expect(factory).not.toHaveBeenCalled();
  });
  it("validates status and kind against the requested queue", async () => {
    expect((await loadRatingsQueue({ status: "resolved" })).error).toMatch(/unavailable/);
    expect((await loadRatingsQueue({ kind: "dispute" })).error).toMatch(/unavailable/);
  });
  it("offers review hide/restore and risk exclude/clear without treating tags as proof", () => {
    const evidence = evidenceFixture();
    expect(evidenceSchema.safeParse(evidence).success).toBe(true);
    expect(availableActions(evidence)).toEqual(["hide", "void", "exclude"]);
    evidence.reviews[0].hidden = true; evidence.trade.risk_excluded = true;
    expect(availableActions(evidence)).toEqual(["restore", "void", "clear_exclusion"]);
    evidence.case.kind = "dispute"; evidence.case.review_id = null; evidence.trade.state = "disputed";
    expect(availableActions(evidence)).toEqual(["resolve", "void", "clear_exclusion"]);
    evidence.trade.voided = true;
    expect(availableActions(evidence)).toEqual([]);
  });
  it("does not broaden unrelated production permissions", () => {
    // Invalid config is denied rather than falling through to Test.
    vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", "production");
    expect(releaseAllows({ operation: "assign-role", targetUserId: otherId, role: "moderator" })).toBe(false);
    expect(releaseAllows({ operation: "revoke-role", targetUserId: otherId })).toBe(false);
  });
});
