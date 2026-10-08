"use server";
import { submitAdminMutation } from "@/lib/admin/action";
import type { AdminResult } from "@/lib/admin/mutations";
export type AdminSupportActionResult = AdminResult;
export async function staffReplySupportTicketAction(ticketId: string, content: string, isInternalNote: boolean) {
  return submitAdminMutation({ operation: "support-reply", ticketId, content, internal: isInternalNote }, ["/admin/support",`/admin/support/${ticketId}`]);
}
export async function updateTicketStatusAction(ticketId: string, status: "open" | "in_progress" | "awaiting_user" | "resolved" | "closed", priority: "low" | "normal" | "high" | "urgent", assignedTo?: string | null) {
  return submitAdminMutation({ operation: "ticket-status", ticketId, status, priority, assignedTo: assignedTo ?? null }, ["/admin/support",`/admin/support/${ticketId}`,"/admin/audit"]);
}
