import "server-only";
import { z } from "zod";
import { TEST_SUPABASE_URL } from "@/lib/config";
import { readAuthConfig } from "./runtime-config";
import { requestClient } from "@/lib/supabase/server";
import type { AdminClient } from "@/lib/supabase/client";

export type Denial = "configuration" | "sign-in" | "denied" | "verification-error" | "mfa" | "policy-required" | "policy-error";
export type StaffAccess = { allowed: true; userId: string; role: "administrator" | "moderator"; aal: "aal1" | "aal2" } |
  { allowed: false; reason: Denial };
const claimsSchema = z.object({
  sub: z.string().uuid(),
  iss: z.literal(`${TEST_SUPABASE_URL}/auth/v1`),
  aud: z.literal("authenticated"),
  role: z.literal("authenticated"),
  aal: z.enum(["aal1", "aal2"]),
  exp: z.number().int().positive(),
});

/** getClaims verifies the signature; getUser additionally checks the Auth identity.
 * Neither cookie-supplied user metadata nor getSession().user grants access.
 */
export async function staffAccess(client: AdminClient, protectedAccess: boolean): Promise<StaffAccess> {
  if (!readAuthConfig()) return { allowed: false, reason: "configuration" };
  try {
    const verified = await client.auth.getClaims();
    if (verified.error || !verified.data) return { allowed: false, reason: "sign-in" };
    const parsed = claimsSchema.safeParse(verified.data.claims);
    if (!parsed.success || parsed.data.exp <= Date.now() / 1000) return { allowed: false, reason: "denied" };
    const identity = await client.auth.getUser();
    const user = identity.data.user;
    if (identity.error || !user) return { allowed: false, reason: "sign-in" };
    if (user.id !== parsed.data.sub || !user.email_confirmed_at || !Number.isFinite(Date.parse(user.email_confirmed_at))) {
      return { allowed: false, reason: "denied" };
    }
    const account = await client.from("user_accounts").select("account_status").eq("user_id", user.id).maybeSingle();
    const staff = await client.from("staff_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (account.error || staff.error) return { allowed: false, reason: "verification-error" };
    if (account.data?.account_status !== "active" || !["administrator", "moderator"].includes(staff.data?.role)) {
      return { allowed: false, reason: "denied" };
    }
    const role = staff.data?.role as "administrator" | "moderator";
    if (protectedAccess) {
      if (parsed.data.aal !== "aal2") return { allowed: false, reason: "mfa" };
      try {
        const policy = await client.rpc("has_current_policy_acceptance");
        if (policy.error || (policy.data !== true && policy.data !== false)) return { allowed: false, reason: "policy-error" };
        if (policy.data === false) return { allowed: false, reason: "policy-required" };
      } catch {
        return { allowed: false, reason: "policy-error" };
      }
    }
    return { allowed: true, userId: user.id, role, aal: parsed.data.aal };
  } catch {
    return { allowed: false, reason: "verification-error" };
  }
}

/** Each protected entry point calls this, independent of proxy/layout navigation. */
export async function requireStaffAccess(): Promise<StaffAccess> {
  if (!readAuthConfig()) return { allowed: false, reason: "configuration" };
  try {
    const client = await requestClient();
    if (!client) return { allowed: false, reason: "configuration" };
    return staffAccess(client, true);
  } catch {
    return { allowed: false, reason: "verification-error" };
  }
}
