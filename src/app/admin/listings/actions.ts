"use server";
import { submitAdminMutation } from "@/lib/admin/action";
import type { AdminResult } from "@/lib/admin/mutations";
export type ModerationActionResult = AdminResult;
export async function moderateListingAction(listingId: string, action: "approve" | "reject" | "remove", reason: string | undefined, revision: number, status: string, reviewFingerprint?: string) {
  return submitAdminMutation({ operation: "moderate", listingId, action, reason, revision, status, ...(reviewFingerprint?{reviewFingerprint}:{}) }, ["/admin/listings",`/admin/listings/${listingId}`,"/admin/audit"]);
}
