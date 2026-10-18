import "server-only";
import { z } from "zod";
import { readAuthConfig } from "./runtime-config";
import { requestClient } from "@/lib/supabase/server";
import type { AdminClient } from "@/lib/supabase/client";
import { diagnosticsFor, observeResult, sdkError } from "./diagnostics";

export type Denial = "configuration" | "sign-in" | "denied" | "verification-error" | "mfa" | "policy-required" | "policy-error";
export const STAFF_ROLES = ["administrator", "moderator", "support_agent", "content_editor"] as const;
export type StaffRole = typeof STAFF_ROLES[number];
export type StaffAccess = { allowed: true; userId: string; role: StaffRole; aal: "aal1" | "aal2"; email?: string } |
  { allowed: false; reason: Denial };
const claimsSchema = z.object({
  sub: z.string().uuid(),
  iss: z.string(),
  aud: z.literal("authenticated"),
  role: z.literal("authenticated"),
  aal: z.enum(["aal1", "aal2"]),
  exp: z.number().int().positive(),
});

/** getClaims verifies the signature; getUser additionally checks the Auth identity.
 * Neither cookie-supplied user metadata nor getSession().user grants access.
 */
export async function staffAccess(client: AdminClient, protectedAccess: boolean, permittedRoles: readonly StaffRole[] = ["administrator", "moderator"]): Promise<StaffAccess> {
  const diagnostics = diagnosticsFor(client);
  const deny = (reason: Denial): StaffAccess => {
    diagnostics.emit("final", "denied");
    return { allowed: false, reason };
  };
  const config = readAuthConfig();
  if (!config) {
    diagnostics.emit("configuration", "error", undefined, "configuration-unavailable");
    return deny("configuration");
  }
  diagnostics.emit("configuration", "ok");
  let stage: "claims" | "claims-validation" | "identity" | "identity-consistency" | "account" | "role" | "eligibility" | "mfa" | "policy" = "claims";
  try {
    const verified = await client.auth.getClaims();
    observeResult(diagnostics, stage, verified);
    if (verified.error || !verified.data) return deny("sign-in");
    stage = "claims-validation";
    const parsed = claimsSchema.safeParse(verified.data.claims);
    if (!parsed.success || parsed.data.iss !== config.issuer || parsed.data.exp <= Date.now() / 1000) {
      diagnostics.emit(stage, "denied", undefined, "invalid-claims");
      return deny("denied");
    }
    diagnostics.emit(stage, "ok");
    stage = "identity";
    const identity = await client.auth.getUser();
    const user = identity.data.user;
    observeResult(diagnostics, stage, identity, !!user);
    if (identity.error || !user) return deny("sign-in");
    stage = "identity-consistency";
    if (user.id !== parsed.data.sub || !user.email_confirmed_at || !Number.isFinite(Date.parse(user.email_confirmed_at))) {
      diagnostics.emit(stage, "denied", undefined, "identity-inconsistent");
      return deny("denied");
    }
    diagnostics.emit(stage, "ok");
    stage = "account";
    const account = await client.from("user_accounts").select("account_status").eq("user_id", user.id).maybeSingle();
    observeResult(diagnostics, stage, account);
    stage = "role";
    const staff = await client.from("staff_roles").select("role").eq("user_id", user.id).maybeSingle();
    observeResult(diagnostics, stage, staff);
    if (account.error || staff.error) return deny("verification-error");
    stage = "eligibility";
    if (account.data?.account_status !== "active" || !STAFF_ROLES.includes(staff.data?.role) || !permittedRoles.includes(staff.data?.role)) {
      diagnostics.emit(stage, "denied", undefined, "ineligible");
      return deny("denied");
    }
    diagnostics.emit(stage, "ok");
    const role = staff.data?.role as StaffRole;
    if (protectedAccess) {
      stage = "mfa";
      if (parsed.data.aal !== "aal2") {
        diagnostics.emit(stage, "required", undefined, "mfa-required");
        return deny("mfa");
      }
      diagnostics.emit(stage, "ok");
      stage = "policy";
      try {
        const policy = await client.rpc("has_current_policy_acceptance");
        if (policy.error) {
          diagnostics.emit(stage, "error", sdkError(policy));
          return deny("policy-error");
        }
        if (policy.data !== true && policy.data !== false) {
          diagnostics.emit(stage, "malformed", undefined, "malformed-policy");
          return deny("policy-error");
        }
        if (policy.data === false) {
          diagnostics.emit(stage, "required", undefined, "policy-required");
          return deny("policy-required");
        }
        diagnostics.emit(stage, "ok");
      } catch (error) {
        diagnostics.emit(stage, "exception", error);
        return deny("policy-error");
      }
    }
    diagnostics.emit("final", "ok");
    return { allowed: true, userId: user.id, role, aal: parsed.data.aal, email: user.email };
  } catch (error) {
    diagnostics.emit(stage, "exception", error);
    return deny("verification-error");
  }
}

/** Each protected entry point calls this, independent of proxy/layout navigation. */
export async function requireStaffAccess(permittedRoles: readonly StaffRole[] = ["administrator", "moderator"]): Promise<StaffAccess> {
  if (!readAuthConfig()) return { allowed: false, reason: "configuration" };
  try {
    const client = await requestClient();
    if (!client) return { allowed: false, reason: "configuration" };
    return staffAccess(client, true, permittedRoles);
  } catch {
    return { allowed: false, reason: "verification-error" };
  }
}
