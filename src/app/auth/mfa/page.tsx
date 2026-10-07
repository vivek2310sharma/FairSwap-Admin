import { readAuthConfig } from "@/lib/auth/runtime-config";
import { redirect } from "next/navigation";
import { MfaForms, SessionControls } from "@/components/auth-forms";
import { requestClient } from "@/lib/supabase/server";
import { staffAccess, STAFF_ROLES } from "@/lib/auth/guard";
import { ownFactors } from "@/lib/auth/mutations";

export const dynamic = "force-dynamic";
export default async function MfaPage() {
  const client = await requestClient();
  if (!client) return <main className="auth-shell"><h1>Authentication configuration is unavailable.</h1></main>;
  const access = await staffAccess(client, false, STAFF_ROLES);
  if (!access.allowed && access.reason === "sign-in") redirect("/auth/sign-in");
  if (!access.allowed) return <main className="auth-shell"><h1>Staff verification unavailable or access denied.</h1><SessionControls /></main>;
  if (access.aal === "aal2") redirect("/admin");
  const all = await ownFactors(client).catch(() => null);
  const verified = all?.filter((factor) => factor.status === "verified") ?? [];
  const factors = (verified.length ? verified : all ?? []).filter((factor) => factor.factor_type === "totp");
  return <main className="auth-shell"><h1>Staff TOTP verification — {readAuthConfig()?.label ?? "DISABLED"}</h1>
    <p>MFA bootstrap grants no protected staff access. Policy checks follow successful MFA.</p>
    {all === null ? <p role="alert">Unable to verify factors. Retry this page or sign out.</p> :
      all.length && !factors.length ? <p role="alert">No eligible TOTP factor. Request supervised recovery; no factors will be replaced.</p> : <MfaForms factors={factors} issuer={readAuthConfig()?.mfaIssuer} />}
    <p>If you left enrollment before completing verification, use the saved authenticator or request supervised recovery.</p>
    <SessionControls />
  </main>;
}
