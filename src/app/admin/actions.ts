"use server";
import { field, submitAdminMutation } from "@/lib/admin/action";
import type { AdminResult } from "@/lib/admin/mutations";
export type AdminActionResult = AdminResult;
export async function assignStaffRoleAction(_state: AdminResult | null, form: FormData): Promise<AdminResult> {
  return submitAdminMutation({ operation: "assign-role", targetUserId: field(form, "targetUserId")!, role: field(form, "role") as "administrator" | "moderator" | "support_agent" | "content_editor" }, ["/admin/staff","/admin/audit"]);
}
export async function revokeStaffRoleAction(_state: AdminResult | null, form: FormData): Promise<AdminResult> {
  return submitAdminMutation({ operation: "revoke-role", targetUserId: field(form, "targetUserId")! }, ["/admin/staff","/admin/audit"]);
}
export async function updateAccountStatusAction(_state: AdminResult | null, form: FormData): Promise<AdminResult> {
  return submitAdminMutation({ operation: "user-status", targetUserId: field(form,"targetUserId")!, newStatus: field(form,"newStatus") as "active" | "suspended", reason: field(form,"reason")!, expectedStatus: field(form,"expectedStatus")! }, ["/admin/users","/admin/audit"]);
}
export async function resolvePrivacyRequestAction(_state: AdminResult | null, form: FormData): Promise<AdminResult> {
  return submitAdminMutation({ operation: "privacy-status", requestId: field(form,"requestId")!, newStatus: field(form,"newStatus") as "pending" | "in_progress" | "resolved" | "rejected", notes: field(form,"notes") }, ["/admin/privacy","/admin/audit"]);
}
