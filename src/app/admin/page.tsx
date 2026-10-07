import { readAuthConfig } from "@/lib/auth/runtime-config";
import { redirect } from "next/navigation";
import { AdminOverview } from "@/components/admin-overview";
import { requireStaffAccess, STAFF_ROLES } from "@/lib/auth/guard";
import { SessionControls } from "@/components/auth-forms";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const config = readAuthConfig();
  const access = await requireStaffAccess(STAFF_ROLES);
  if (!access.allowed && access.reason === "sign-in") redirect("/auth/sign-in");
  if (!access.allowed && access.reason === "mfa") redirect("/auth/mfa");
  return <main className="auth-shell"><h1>FairSwap Admin — {config?.label ?? "DISABLED"}</h1>
    {access.allowed ? <><h2>Staff access confirmed</h2><AdminOverview role={access.role} /></> :
      access.reason === "policy-required" ? <><h2>Policy review required</h2>
        <p>Sign into the {config?.label} marketplace separately using the same account, complete its existing policy review, then return manually to Admin and recheck access. Admin sends no tokens or account details to Web.</p>
        <a href={config?.policyReviewUrl} rel="noreferrer">Review marketplace policies</a>
      </> : <><h2>{access.reason === "policy-error" ? "Policy verification unavailable" : "Staff access denied or verification unavailable"}</h2><p role="alert">Protected access is disabled. Retry or sign out.</p></>}
    <SessionControls retry />
  </main>;
}
