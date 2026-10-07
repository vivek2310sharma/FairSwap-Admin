"use server";
import { submitAdminMutation } from "@/lib/admin/action";
import type { AdminResult } from "@/lib/admin/mutations";
export type ModerationActionResult = AdminResult;
export async function moderateListingAction(listingId: string, action: "approve" | "reject" | "remove", reason: string | undefined, revision: number, status: string) {
  return submitAdminMutation({ operation: "moderate", listingId, action, reason, revision, status }, ["/admin/listings",`/admin/listings/${listingId}`,"/admin/audit"]);
}
