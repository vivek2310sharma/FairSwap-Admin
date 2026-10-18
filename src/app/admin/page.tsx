import { readAuthConfig } from "@/lib/auth/runtime-config";
import { redirect } from "next/navigation";
import { AdminOverview } from "@/components/admin-overview";
import { requireStaffAccess, STAFF_ROLES } from "@/lib/auth/guard";
import { SessionControls } from "@/components/auth-forms";
import { ShieldCheck, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const config = readAuthConfig();
  const access = await requireStaffAccess(STAFF_ROLES);

  if (!access.allowed && access.reason === "sign-in") redirect("/auth/sign-in");
  if (!access.allowed && access.reason === "mfa") redirect("/auth/mfa");

  if (access.allowed) {
    return <AdminOverview role={access.role} isProduction={config?.environment === "production"} />;
  }

  return (
    <main className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-900 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">FairSwap Admin</h1>
          <p className="text-xs text-slate-500 font-medium">{config?.label ?? "DISABLED"} Portal</p>
        </div>
      </div>

      {access.reason === "policy-required" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Marketplace Policy Review Required</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sign into the <strong>{config?.label}</strong> marketplace separately using the same account, complete its existing policy review, then return manually to Admin and recheck access. Admin sends no tokens or account details to Web.
          </p>
          {config?.policyReviewUrl && (
            <a
              href={config.policyReviewUrl}
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <span>Review Marketplace Policies</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {access.reason === "policy-error"
              ? "Policy Verification Unavailable"
              : "Staff Access Denied"}
          </h2>
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            Protected access is disabled or verification was unsuccessful. Please recheck your credentials or retry session access.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <SessionControls retry />
      </div>
    </main>
  );
}
