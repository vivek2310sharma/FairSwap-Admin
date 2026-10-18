import { readAuthConfig } from "@/lib/auth/runtime-config";
import { redirect } from "next/navigation";
import { MfaForms, SessionControls } from "@/components/auth-forms";
import { requestClient } from "@/lib/supabase/server";
import { staffAccess, STAFF_ROLES } from "@/lib/auth/guard";
import { ownFactors } from "@/lib/auth/mutations";
import { Shield, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const client = await requestClient();
  const config = readAuthConfig();

  if (!client) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4">
          <h1 className="text-lg font-bold text-slate-900">Authentication Configuration Unavailable</h1>
          <p className="text-sm text-slate-600">The server authentication configuration could not be loaded.</p>
        </div>
      </main>
    );
  }

  const access = await staffAccess(client, false, STAFF_ROLES);
  if (!access.allowed && access.reason === "sign-in") redirect("/auth/sign-in");
  if (!access.allowed) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-6">
          <h1 className="text-lg font-bold text-slate-900">Staff Verification Unavailable</h1>
          <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
            Protected access is disabled or verification was unsuccessful. Please retry session access.
          </p>
          <SessionControls retry />
        </div>
      </main>
    );
  }

  if (access.aal === "aal2") redirect("/admin");

  const all = await ownFactors(client).catch(() => null);
  const verified = all?.filter((factor) => factor.status === "verified") ?? [];
  const factors = (verified.length ? verified : all ?? []).filter((factor) => factor.factor_type === "totp");

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden space-y-6 p-6 sm:p-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">
              FairSwap <span className="text-emerald-600 font-medium">Admin</span>
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {config?.label ?? "DISABLED"} Portal
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <span>Staff Multi-Factor Authentication</span>
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            MFA verification is required before protected staff access is granted.
          </p>
        </div>

        {all === null ? (
          <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            Unable to verify factors. Retry this page or sign out.
          </p>
        ) : all.length && !factors.length ? (
          <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            No eligible TOTP factor. Request supervised recovery; no factors will be replaced.
          </p>
        ) : (
          <MfaForms factors={factors} issuer={config?.mfaIssuer} />
        )}

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <p className="text-2xs text-slate-500 leading-relaxed">
            If you left enrollment before completing verification, use your saved authenticator or request supervised recovery.
          </p>
          <SessionControls />
        </div>
      </div>
    </main>
  );
}
