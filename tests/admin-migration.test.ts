import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const request = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ requestClient: request.client }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
import { adminMutation } from "@/lib/admin/mutations";
import { pageClient } from "@/lib/admin/server";
import { parseReportEvidence } from "@/lib/admin/evidence";
import { safeAdminCall } from "@/lib/admin/client-result";
import { staffAccess, STAFF_ROLES } from "@/lib/auth/guard";
import { authMutation } from "@/lib/auth/mutations";
import { TEST_SUPABASE_URL } from "@/lib/config";
import type { AdminClient } from "@/lib/supabase/client";

const actor = "11111111-1111-4111-8111-111111111111";
const target = "22222222-2222-4222-8222-222222222222";
const origin = "http://127.0.0.1:3000";
const host = "127.0.0.1:3000";
function fixture() {
  const claims = { sub: actor, iss: `${TEST_SUPABASE_URL}/auth/v1`, aud: "authenticated", role: "authenticated", aal: "aal2", exp: Date.now() / 1000 + 300 | 0 };
  const rows: Record<string, { data: unknown; error: unknown }> = {
    user_accounts: { data: { account_status: "active" }, error: null },
    staff_roles: { data: { role: "administrator" }, error: null },
    listings: { data: { id: target, seller_id: target, revision: 2, status: "pending_review" }, error: null },
    categories: { data: [], error: null },
  };
  const builder = (table: string) => {
    const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), order: vi.fn(() => chain), limit: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => rows[table]), then: (resolve: (result: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(rows[table]).then(resolve,reject) };
    return chain;
  };
  const client = {
    from: vi.fn(builder),
    rpc: vi.fn(async (name: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: unknown }> => {
      if (name === "has_current_policy_acceptance") return { data: true, error: null };
      if (name === "admin_search_users") return { data: [{ user_id: target, role: null, account_status: "active" }], error: null };
      if (name === "moderate_listing") { rows.listings.data = { id: target, status: args?.action === "reject" ? "rejected" : args?.action === "remove" ? "removed" : "active" }; return { data: { success: true }, error: null }; }
      if (["admin_manage_category", "admin_manage_location"].includes(name)) return { data: { success: true }, error: null };
      if (["admin_reply_support_ticket", "admin_add_ticket_internal_note"].includes(name)) return { data: target, error: null };
      return { data: null, error: null };
    }),
    auth: { getClaims: vi.fn(async () => ({ data: { claims }, error: null })), getUser: vi.fn(async () => ({ data: { user: { id: actor, email_confirmed_at: "2026-01-01T00:00:00Z" } }, error: null })),
      signInWithPassword: vi.fn(async () => ({ error: null })), signOut: vi.fn(async () => ({ error: null })),
    },
  };
  return { rows, claims, client, typed: client as unknown as AdminClient };
}
let f: ReturnType<typeof fixture>;
const factory = async () => f.typed;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", "test"); vi.stubEnv("FAIRSWAP_SUPABASE_URL", TEST_SUPABASE_URL);
  vi.stubEnv("FAIRSWAP_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_synthetic_fixture_not_a_real_key");
  f = fixture(); request.client.mockImplementation(factory);
});
const moderate = { operation: "moderate", listingId: target, action: "approve", revision: 2, status: "pending_review" };
const cases = [
  [moderate, "moderate_listing"],
  [{ ...moderate, action: "reject", reason: "Synthetic review reason" }, "moderate_listing"],
  [{ ...moderate, action: "remove", reason: "Synthetic removal reason" }, "moderate_listing"],
  [{ operation: "user-status", targetUserId: target, newStatus: "suspended", expectedStatus: "active", reason: "Synthetic moderation reason" }, "admin_update_user_account_status"],
  [{ operation: "assign-role", targetUserId: target, role: "moderator" }, "admin_assign_staff_role"],
  [{ operation: "revoke-role", targetUserId: target }, "admin_revoke_staff_role"],
  [{ operation: "privacy-status", requestId: target, newStatus: "in_progress", notes: "Synthetic note" }, "admin_resolve_privacy_request"],
  [{ operation: "resolve-report", reportId: target, newStatus: "dismissed", notes: "Synthetic finding" }, "admin_resolve_report"],
  [{ operation: "support-reply", ticketId: target, content: "Synthetic reply", internal: false }, "admin_reply_support_ticket"],
  [{ operation: "support-reply", ticketId: target, content: "Synthetic internal note", internal: true }, "admin_add_ticket_internal_note"],
  [{ operation: "ticket-status", ticketId: target, status: "resolved", priority: "normal", assignedTo: null }, "admin_update_ticket_status"],
  [{ operation: "category", action: "create", categoryId: null, name: "Synthetic category", slug: "synthetic-category", description: null, icon: null, sortOrder: 0, active: true }, "admin_manage_category"],
  [{ operation: "location", action: "create_city", cityId: null, localityId: null, name: "Synthetic city", state: "Synthetic state", slug: "synthetic-city", active: true }, "admin_manage_location"],
] as const;

describe("migrated RPC integrations", () => {
  it.each(cases)("invokes the existing authorized backend operation %j", async (input, rpc) => {
    expect(await adminMutation(input,origin,host,factory)).toMatchObject({ success: true });
    expect(f.client.rpc).toHaveBeenCalledWith(rpc,expect.any(Object)); expect(fetch).not.toHaveBeenCalled();
  });
  it.each(cases)("denies %j before writes for an AAL1 caller", async (input, rpc) => {
    f.claims.aal = "aal1";
    expect((await adminMutation(input,origin,host,factory)).success).not.toBe(true);
    expect(f.client.rpc.mock.calls.some(([name]) => name === rpc)).toBe(false);
  });
  it.each(["support_agent", "content_editor"])("does not grant %s listing mutation access", async role => {
    f.rows.staff_roles.data = { role }; expect((await adminMutation(moderate,origin,host,factory)).error).toBeDefined();
    expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it("denies an unknown operation and fields before constructing a client", async () => {
    const create = vi.fn(factory);
    for(const input of [{ ...moderate, password: "SECRET_SENTINEL" }, { operation: "sql", command: "anything" }, { ...moderate, listingId: "invalid" }]) {
      expect((await adminMutation(input,origin,host,create)).error).toBeDefined();
    }
    expect(create).not.toHaveBeenCalled();
  });
  it("rejects cross-origin and missing capability", async () => {
    const create = vi.fn(factory); expect((await adminMutation(moderate,"https://elsewhere.invalid",host,create)).error).toBeDefined(); expect(create).not.toHaveBeenCalled();
    expect((await adminMutation(moderate,origin,host,async () => null)).success).not.toBe(true);
  });
  it.each(["suspended", "deleted"])("rejects inactive %s actors", async status => {
    f.rows.user_accounts.data = { account_status: status }; expect((await adminMutation(moderate,origin,host,factory)).error).toBeDefined(); expect(f.client.rpc).not.toHaveBeenCalled();
  });
  it("rejects wrong issuer and stale policies", async () => {
    f.claims.iss = "https://wrong-project.supabase.co/auth/v1";
    expect((await adminMutation(moderate,origin,host,factory)).error).toBeDefined(); expect(f.client.from).not.toHaveBeenCalled();
    f.claims.iss = `${TEST_SUPABASE_URL}/auth/v1`;
    f.client.rpc.mockResolvedValue({ data: false,error:null });
    expect((await adminMutation(moderate,origin,host,factory)).error).toBeDefined(); expect(f.client.rpc).toHaveBeenCalledTimes(1);
  });
  it("rejects self moderation, missing reasons and changed revisions", async () => {
    expect((await adminMutation({ ...moderate, action: "reject" },origin,host,factory)).error).toBeDefined();
    f.rows.listings.data = { id: target, seller_id: actor, revision: 2, status: "pending_review" };
    expect((await adminMutation(moderate,origin,host,factory)).error).toBeDefined();
    f.rows.listings.data = { id: target, seller_id: target, revision: 3, status: "pending_review" };
    expect((await adminMutation(moderate,origin,host,factory)).error).toContain("changed");
    expect(f.client.rpc.mock.calls.some(([name]) => name === "moderate_listing")).toBe(false);
  });
  it("keeps an unconfirmed final moderation state failed", async () => {
    f.client.rpc.mockImplementation(async name => ({ data: name === "has_current_policy_acceptance" ? true : { success: true },error:null }));
    expect((await adminMutation(moderate,origin,host,factory)).error).toContain("final state");
  });
  it("does not expose SDK errors or consider a false success envelope successful", async () => {
    f.client.rpc.mockImplementation(async name => name === "has_current_policy_acceptance" ? { data: true,error:null } : { data: { success: false },error:null });
    expect((await adminMutation(moderate,origin,host,factory)).success).not.toBe(true);
    f.client.rpc.mockImplementation(async name => { if(name === "has_current_policy_acceptance") return { data:true,error:null }; throw new Error("SECRET_SENTINEL"); });
    const result = await adminMutation(moderate,origin,host,factory);
    expect(result.error).toBeDefined(); expect(JSON.stringify(result)).not.toContain("SECRET_SENTINEL");
  });
  it("prevents moderator status changes to staff and mismatched target rows", async () => {
    f.rows.staff_roles.data = { role: "moderator" };
    const input = cases[3][0];
    for(const row of [{ user_id: target, role: "support_agent", account_status: "active" }, { user_id: actor, role:null,account_status:"active" }]) {
      f.client.rpc.mockImplementation(async name => ({ data:name === "has_current_policy_acceptance" ? true : [row],error:null }));
      expect((await adminMutation(input,origin,host,factory)).error).toBeDefined();
    }
    expect(f.client.rpc.mock.calls.some(([name]) => name === "admin_update_user_account_status")).toBe(false);
  });
});

describe("role-specific authentication and protected reads", () => {
  it.each(["support_agent", "content_editor"])("admits existing %s identity for MFA while preserving the listing denial", async role => {
    f.rows.staff_roles.data = { role }; f.claims.aal = "aal1";
    expect(await staffAccess(f.typed,false,STAFF_ROLES)).toMatchObject({ allowed:true,role });
    const form = new FormData(); form.set("email","synthetic@example.invalid"); form.set("password","SYNTHETIC_PASSWORD");
    expect(await authMutation("sign-in",form,origin,host,factory)).toEqual({ redirectTo:"/auth/mfa" });
    expect((await staffAccess(f.typed,true,STAFF_ROLES)).allowed).toBe(false);
    f.claims.aal = "aal2";
    expect((await staffAccess(f.typed,true,STAFF_ROLES)).allowed).toBe(true);
    expect((await staffAccess(f.typed,true)).allowed).toBe(false);
    await expect(pageClient(["administrator","moderator"])).rejects.toThrow("REDIRECT:/admin?denied=1");
  });
  it("sanitizes read failures instead of returning an empty list", async () => {
    const client = await pageClient(["administrator"]);
    f.rows.categories.error = { message: "SECRET_SENTINEL" };
    await expect(client.from("categories").select("*").order("name")).rejects.toThrow("Test data unavailable");
    f.rows.categories.error = null;
    expect((await client.from("categories").select("*")).data).toEqual([]);
  });
});

describe("evidence and client-result contracts", () => {
  const message = { id:target,sender_name:"Synthetic sender",content:"Synthetic evidence",created_at:"2026-01-01T00:00:00Z",ignored_secret:"SECRET_SENTINEL" };
  it("parses the real bounded envelope and strips unrelated fields", () => {
    const result = parseReportEvidence({ report_id:actor,reported_message:message,preceding_context:[] },actor,target);
    expect(result).toHaveLength(1); expect(JSON.stringify(result)).not.toContain("SECRET_SENTINEL");
  });
  it("rejects wrong case, wrong message and oversized evidence", () => {
    const envelope = { report_id:actor,reported_message:message,preceding_context:[] };
    expect(parseReportEvidence(envelope,target,target)).toBeNull(); expect(parseReportEvidence(envelope,actor,actor)).toBeNull();
    expect(parseReportEvidence({ ...envelope,preceding_context:Array(4).fill(message) },actor,target)).toBeNull();
    expect(parseReportEvidence([message],actor,target)).toBeNull();
  });
  it("contains asynchronous transport failures and rejects empty completion", async () => {
    expect(await safeAdminCall(async () => ({}))).toHaveProperty("error");
    const result = await safeAdminCall(async () => { throw new Error("SECRET_SENTINEL"); });
    expect(JSON.stringify(result)).not.toContain("SECRET_SENTINEL"); expect(result.success).not.toBe(true);
  });
});
