import { SignInForm } from "@/components/auth-forms";
import { readAuthConfig } from "@/lib/auth/runtime-config";
import { Shield, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  const config = readAuthConfig();

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
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>Staff Sign-In</span>
          </h1>
          <p className="text-xs text-slate-500">
            Sign in with your assigned staff credentials to access administrative workflows.
          </p>
        </div>

        {config ? (
          <SignInForm />
        ) : (
          <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
            Authentication configuration is unavailable. Sign-in is disabled.
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Existing staff accounts only. Public registration and automated password recovery are disabled.
          </p>
        </div>
      </div>
    </main>
  );
}
