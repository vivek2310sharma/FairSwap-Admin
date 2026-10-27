"use server";
import { updateAccountStatusAction, revokeVerificationAction } from "../actions";
import type { AdminResult } from "@/lib/admin/mutations";
export type UserModerationResult = AdminResult;
export async function updateUserAccountStatusAction(state: AdminResult | null, form: FormData) { return updateAccountStatusAction(state, form); }
export { revokeVerificationAction };
