import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStaffAccess } from "@/lib/auth/guard";
import { SessionControls } from "@/components/auth-forms";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const access = await requireStaffAccess();
  if (!access.allowed && access.reason === "sign-in") redirect("/auth/sign-in");
  if (!access.allowed && access.reason === "mfa") redirect("/auth/mfa");
  return <main className="auth-shell"><h1>FairSwap Admin — TEST</h1>
    {access.allowed ? <><h2>Staff access confirmed</h2><p><Link href="/admin/listings" prefetch={false}>Open pending-listings review queue</Link></p><p>Listing review is read-only. Moderation decisions and staff administration are not available.</p></> :
      access.reason === "policy-required" ? <><h2>Policy review required</h2>
        <p>Sign into Test Web separately using the same account, complete its existing policy review, then return manually to Admin and recheck access. Admin sends no tokens or account details to Web.</p>
        <a href="https://fair-swap-git-staging-fairswap.vercel.app/account/policy-review" rel="noreferrer">Review policies on Test Web</a>
      </> : <><h2>{access.reason === "policy-error" ? "Policy verification unavailable" : "Staff access denied or verification unavailable"}</h2><p role="alert">Protected access is disabled. Retry or sign out.</p></>}
    <SessionControls retry />
  </main>;
}
