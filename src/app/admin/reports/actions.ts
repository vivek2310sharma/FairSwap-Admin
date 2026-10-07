"use server";
import { submitAdminMutation } from "@/lib/admin/action";
import type { AdminResult } from "@/lib/admin/mutations";
export type AdminReportActionResult = AdminResult;
export async function resolveReportAction(reportId: string, newStatus: "investigating" | "resolved" | "dismissed", resolutionNotes?: string) {
  return submitAdminMutation({ operation: "resolve-report", reportId, newStatus, notes: resolutionNotes }, ["/admin/reports",`/admin/reports/${reportId}`,"/admin/audit"]);
}
