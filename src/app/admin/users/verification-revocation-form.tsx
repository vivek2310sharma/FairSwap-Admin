"use client";

import { useActionState } from "react";
import { revokeVerificationAction } from "../actions";
import { ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";

interface VerificationRevocationFormProps {
  targetUserId: string;
  isSelf: boolean;
  canRevoke: boolean;
  blockReason?: string;
}

export default function VerificationRevocationForm({
  targetUserId,
  isSelf,
  canRevoke,
  blockReason,
}: VerificationRevocationFormProps) {
  const [state, formAction, isPending] = useActionState(revokeVerificationAction, null);

  if (isSelf || !canRevoke) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" role="alert">
        <span className="font-semibold">Action Unavailable: </span>
        {blockReason || "You do not have permission to revoke verification for this account."}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="targetUserId" value={targetUserId} />

      <div>
        <label htmlFor="reason" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Mandatory Revocation Reason
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          required
          minLength={5}
          maxLength={500}
          placeholder="State the verified regulatory, fraud, or user-requested ground for revoking this badge..."
          className="w-full text-xs rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
        />
        <p className="mt-1 text-[11px] text-gray-500">
          Must be at least 5 characters. This reason is immutably recorded in the IDV security audit ledger.
        </p>
      </div>

      {state?.error && (
        <div role="alert" className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div role="status" className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Verification badge revoked and audited successfully.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-[38px] w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
      >
        <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
        <span>{isPending ? "Revoking Badge…" : "Revoke Verified Badge"}</span>
      </button>
    </form>
  );
}
