import "server-only";
import { z } from "zod";
import { readAuthConfig } from "./runtime-config";
import { staffAccess, STAFF_ROLES } from "./guard";
import { signInSchema, verificationSchema, sameOriginMutation, safeAdminRedirect, type AuthState } from "./inputs";
import { requestClient } from "@/lib/supabase/server";
import type { AdminClient } from "@/lib/supabase/client";

export type Operation = "sign-in" | "enroll" | "verify" | "sign-out" | "recheck";
const failure: AuthState = { error: "Unable to complete this request. Check your session or try again." };
const factorSchema = z.array(z.object({
  id: z.string().uuid(),
  factor_type: z.enum(["totp", "phone", "webauthn"]),
  status: z.enum(["verified", "unverified"]),
}));

export async function ownFactors(client: AdminClient) {
  const result = await client.auth.mfa.listFactors();
  if (result.error) return null;
  const parsed = factorSchema.safeParse(result.data?.all);
  return parsed.success ? parsed.data : null;
}

/** Production action logic; tests substitute only SDK/request transport. */
export async function authMutation(
  operation: Operation,
  form: FormData,
  origin: string | null,
  host: string | null,
  factory: () => Promise<AdminClient | null> = () => requestClient(true),
): Promise<AuthState> {
  if (!sameOriginMutation(origin, host)) return { error: "Request origin rejected." };
  const config = readAuthConfig();
  if (!config) return { error: "Authentication configuration is unavailable." };
  const signIn = operation === "sign-in" ? signInSchema.safeParse({ email: form.get("email"), password: form.get("password") }) : null;
  const verification = operation === "verify" ? verificationSchema.safeParse({ factorId: form.get("factorId"), code: form.get("code") }) : null;
  if ((signIn && !signIn.success) || (verification && !verification.success)) {
    return { error: "Enter valid authentication details." };
  }
  try {
    const client = await factory();
    if (!client) return failure;
    if (operation === "sign-out") {
      const result = await client.auth.signOut({ scope: "local" });
      return result.error ? failure : { redirectTo: "/auth/sign-in" };
    }
    if (signIn?.success) {
      const result = await client.auth.signInWithPassword(signIn.data);
      if (result.error) return { error: "Sign-in failed. Check your email and password or try again." };
    }
    const access = await staffAccess(client, operation === "recheck", STAFF_ROLES);
    if (!access.allowed) {
      if (operation === "sign-in") await client.auth.signOut({ scope: "local" });
      return failure;
    }
    if (operation === "recheck") return { redirectTo: "/admin" };
    if (operation === "sign-in" || access.aal === "aal2") {
      return { redirectTo: access.aal === "aal2" ? safeAdminRedirect(form.get("next")) : "/auth/mfa" };
    }
    const factors = await ownFactors(client);
    if (!factors) return failure;
    if (operation === "enroll") {
      // Existing factors require challenge or separately supervised recovery.
      // No factor replacement/deletion or page-render enrollment.
      if (factors.length) return { error: "A factor already exists. Verify it or request supervised recovery." };
      const enrollment = await client.auth.mfa.enroll({ factorType: "totp", issuer: config.mfaIssuer });
      if (enrollment.error || !enrollment.data || enrollment.data.type !== "totp") return failure;
      const id = z.string().uuid().safeParse(enrollment.data.id);
      const secret = z.string().regex(/^[A-Z2-7]{16,256}$/).safeParse(enrollment.data.totp.secret);
      if (!id.success || !secret.success) return failure;
      return { enrollment: { factorId: id.data, secret: secret.data } };
    }
    if (operation === "verify" && verification?.success) {
      const verifiedFactors = factors.filter((factor) => factor.status === "verified");
      const eligible = verifiedFactors.length ? verifiedFactors : factors;
      if (!eligible.some((factor) => factor.id === verification.data.factorId && factor.factor_type === "totp")) return failure;
      const result = await client.auth.mfa.challengeAndVerify(verification.data);
      if (result.error) return { error: "MFA verification failed. Check your code or session and try again." };
      // Enrolment or a successful-looking response is insufficient: verify the new JWT.
      const elevated = await staffAccess(client, false, STAFF_ROLES);
      if (!elevated.allowed || elevated.aal !== "aal2") return failure;
      return { redirectTo: safeAdminRedirect(form.get("next")) };
    }
    return failure;
  } catch {
    // Never serialize SDK diagnostics, credentials, codes, or tokens.
    return failure;
  }
}
