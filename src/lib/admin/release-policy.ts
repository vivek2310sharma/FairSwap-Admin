import "server-only";
import { readAuthConfig } from "@/lib/auth/runtime-config";
import type { AdminMutation } from "./mutations";
/** First Production release excludes high-impact paths without acceptance evidence.
 * Test retains existing features. This is additional to role/AAL2/policy/RLS checks. */
export function releaseAllows(value: AdminMutation) {
  const config = readAuthConfig();
  if (!config) return false;
  if (config.environment === "test") return true;
  if (["assign-role", "revoke-role", "user-status", "privacy-status"].includes(value.operation)) return false;
  return value.operation !== "moderate" || value.action !== "remove";
}
