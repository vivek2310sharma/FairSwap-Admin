import "server-only";
import { z } from "zod";
import { staffAccess, type StaffRole } from "@/lib/auth/guard";
import { sameOriginMutation } from "@/lib/auth/inputs";
import { requestClient } from "@/lib/supabase/server";
import type { AdminClient } from "@/lib/supabase/client";

const id = z.string().uuid();
const text = z.string().trim().min(1).max(3000);
const optionalText = z.string().trim().max(3000).nullable().optional();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const schema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("moderate"), listingId: id, action: z.enum(["approve", "reject", "remove"]), reason: optionalText, revision: z.number().int().positive(), status: z.string().max(30) }).strict(),
  z.object({ operation: z.literal("user-status"), targetUserId: id, newStatus: z.enum(["active", "suspended"]), reason: z.string().trim().min(10).max(500), expectedStatus: z.string().max(30) }).strict(),
  z.object({ operation: z.literal("assign-role"), targetUserId: id, role: z.enum(["administrator", "moderator", "support_agent", "content_editor"]) }).strict(),
  z.object({ operation: z.literal("revoke-role"), targetUserId: id }).strict(),
  z.object({ operation: z.literal("privacy-status"), requestId: id, newStatus: z.enum(["pending", "in_progress", "resolved", "rejected"]), notes: optionalText }).strict(),
  z.object({ operation: z.literal("resolve-report"), reportId: id, newStatus: z.enum(["investigating", "resolved", "dismissed"]), notes: optionalText }).strict(),
  z.object({ operation: z.literal("support-reply"), ticketId: id, content: text, internal: z.boolean() }).strict(),
  z.object({ operation: z.literal("ticket-status"), ticketId: id, status: z.enum(["open", "in_progress", "awaiting_user", "resolved", "closed"]), priority: z.enum(["low", "normal", "high", "urgent"]), assignedTo: id.nullable() }).strict(),
  z.object({ operation: z.literal("category"), action: z.enum(["create", "update"]), categoryId: id.nullable(), slug: slug.nullable(), name: z.string().trim().min(1).max(150).nullable(), description: optionalText, icon: z.string().max(100).nullable(), sortOrder: z.number().int().min(0).max(100000).nullable(), active: z.boolean() }).strict(),
  z.object({ operation: z.literal("location"), action: z.enum(["create_city", "update_city", "create_locality", "update_locality"]), cityId: id.nullable(), localityId: id.nullable(), name: z.string().trim().min(1).max(150).nullable(), state: z.string().trim().min(1).max(150).nullable(), slug: slug.nullable(), active: z.boolean() }).strict(),
]);
export type AdminMutation = z.infer<typeof schema>;
export type AdminResult = { error?: string; success?: boolean; message?: string };
const roles: Record<AdminMutation["operation"], readonly StaffRole[]> = {
  moderate: ["administrator", "moderator"], "user-status": ["administrator", "moderator"],
  "assign-role": ["administrator"], "revoke-role": ["administrator"], "privacy-status": ["administrator"],
  "resolve-report": ["administrator", "moderator"], "support-reply": ["administrator", "support_agent"],
  "ticket-status": ["administrator", "support_agent"], category: ["administrator", "content_editor"], location: ["administrator"],
};
const failed: AdminResult = { error: "Operation not confirmed. Refresh the record before deciding whether to try again." };

/** Reviewed operations only. No SDK administrator, direct table write, privileged client or automatic retry. */
export async function adminMutation(input: unknown, origin: string | null, host: string | null,
  factory: () => Promise<AdminClient | null> = () => requestClient(true)): Promise<AdminResult> {
  if (!sameOriginMutation(origin, host)) return { error: "Request origin rejected." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Check the submitted identifiers and field values." };
  const value = parsed.data;
  if (value.operation === "moderate" && value.action !== "approve" && !value.reason?.trim()) return { error: "A reason is required." };
  if (value.operation === "category" && (value.action === "create" ? !value.slug || !value.name : !value.categoryId)) return { error: "Category identity, name and slug are required for this action." };
  if (value.operation === "location" && ((value.action === "create_city" && (!value.name || !value.state || !value.slug)) || (value.action === "create_locality" && (!value.cityId || !value.name || !value.slug)) || (value.action === "update_city" && !value.cityId) || (value.action === "update_locality" && !value.localityId))) return { error: "Check the city/locality identity and required fields." };
  try {
    const client = await factory();
    if (!client) return failed;
    const access = await staffAccess(client, true, roles[value.operation]);
    if (!access.allowed) return { error: "This operation requires an eligible staff session, MFA and current policy acceptance." };
    let rpc: string;
    let args: Record<string, unknown>;
    switch (value.operation) {
      case "moderate": {
        const row = await client.from("listings").select("id,seller_id,status,revision").eq("id", value.listingId).maybeSingle();
        if (row.error || !row.data || row.data.seller_id === access.userId) return failed;
        if (row.data.revision !== value.revision || row.data.status !== value.status) return { error: "The listing changed. Refresh and review it again." };
        // This precheck improves stale-review feedback; the existing RPC has no atomic expected-revision argument.
        rpc = "moderate_listing"; args = { listing_id: value.listingId, action: value.action, reason: value.reason || null }; break;
      }
      case "user-status": {
        if (value.targetUserId === access.userId) return { error: "You cannot change your own account status." };
        const target = await client.rpc("admin_search_users", { p_query: value.targetUserId, p_limit: 1, p_offset: 0 });
        const row = Array.isArray(target.data) ? target.data[0] : null;
        if (target.error || row?.user_id !== value.targetUserId || (access.role === "moderator" && row.role)) return failed;
        if (row.account_status !== value.expectedStatus || row.account_status === value.newStatus) return { error: "The account status changed or already matches. Refresh before acting." };
        rpc = "admin_update_user_account_status"; args = { p_target_user_id: value.targetUserId, p_new_status: value.newStatus, p_reason: value.reason }; break;
      }
      case "assign-role": rpc = "admin_assign_staff_role"; args = { p_target_user_id: value.targetUserId, p_new_role: value.role }; break;
      case "revoke-role": rpc = "admin_revoke_staff_role"; args = { p_target_user_id: value.targetUserId }; break;
      case "privacy-status": rpc = "admin_resolve_privacy_request"; args = { p_request_id: value.requestId, p_new_status: value.newStatus, p_notes: value.notes || null }; break;
      case "resolve-report": rpc = "admin_resolve_report"; args = { report_id: value.reportId, new_status: value.newStatus, resolution_notes: value.notes || null }; break;
      case "support-reply": rpc = value.internal ? "admin_add_ticket_internal_note" : "admin_reply_support_ticket"; args = { ticket_id: value.ticketId, content: value.content }; break;
      case "ticket-status": rpc = "admin_update_ticket_status"; args = { ticket_id: value.ticketId, status: value.status, priority: value.priority, assigned_to: value.assignedTo }; break;
      case "category": rpc = "admin_manage_category"; args = { action: value.action, category_id: value.categoryId, slug: value.slug, name: value.name, description: value.description || null, icon: value.icon, sort_order: value.sortOrder, is_active: value.active }; break;
      case "location": rpc = "admin_manage_location"; args = { action: value.action, city_id: value.cityId, locality_id: value.localityId, name: value.name, state: value.state, slug: value.slug, is_active: value.active }; break;
    }
    const result = await client.rpc(rpc, args);
    if (result.error) return result.error.code === "23505" ? { error: "That value already exists. Refresh and check for duplicates." } : failed;
    if (["moderate", "category", "location"].includes(value.operation) && result.data?.success !== true) return failed;
    if (value.operation === "support-reply" && !id.safeParse(result.data).success) return failed;
    if (value.operation === "moderate") {
      const expected = { approve: "active", reject: "rejected", remove: "removed" }[value.action];
      const observed = await client.from("listings").select("id,status").eq("id", value.listingId).maybeSingle();
      if (observed.error || observed.data?.id !== value.listingId || observed.data?.status !== expected) return { error: "Backend acknowledged the decision, but its final state was not confirmed. Refresh; do not resubmit blindly." };
    }
    return { success: true, message: value.operation === "support-reply" ? (value.internal ? "Internal note added." : "Customer reply recorded.") : "Backend operation completed." };
  } catch { return failed; }
}
