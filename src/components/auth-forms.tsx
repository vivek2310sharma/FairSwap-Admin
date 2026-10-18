"use client";

import { useActionState, useState } from "react";
import { signInAction, enrollAction, verifyAction, signOutAction, recheckAction } from "@/app/auth/actions";
import { signInSchema, verificationSchema } from "@/lib/auth/inputs";
import { LogOut, RefreshCw } from "lucide-react";

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, {});
  const [invalid, setInvalid] = useState(false);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const form = new FormData(event.currentTarget);
        const valid = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") }).success;
        setInvalid(!valid);
        if (!valid) event.preventDefault();
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Staff email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-2xs"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={4096}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-2xs"
        />
      </div>

      <input type="hidden" name="next" value="/admin" />

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {(invalid || state.error) && (
        <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
          {invalid ? "Enter a valid email and password." : state.error}
        </p>
      )}
    </form>
  );
}

export function MfaForms({ factors, issuer = "FairSwap Admin" }: { factors: { id: string; status: string }[]; issuer?: string }) {
  const [enrollment, enroll, enrolling] = useActionState(enrollAction, {});
  const [verification, verify, verifying] = useActionState(verifyAction, {});
  const [invalid, setInvalid] = useState(false);
  const choices = enrollment.enrollment ? [{ id: enrollment.enrollment.factorId, status: "unverified" }] : factors;

  return (
    <div className="space-y-4">
      {!factors.length && !enrollment.enrollment && (
        <form action={enroll} className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Set up your own authenticator only through the supervised staff process.
          </p>
          <button
            type="submit"
            disabled={enrolling || verifying}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {enrolling ? "Preparing authenticator…" : "Begin TOTP enrollment"}
          </button>
        </form>
      )}

      {enrollment.error && (
        <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
          {enrollment.error}
        </p>
      )}

      {enrollment.enrollment && (
        <div role="status" className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
          <p className="text-slate-300">
            In your authenticator, add a time-based account named <strong>{issuer}</strong> using this setup key:
          </p>
          <code className="block p-2.5 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-wrap-anywhere border border-slate-800">
            {enrollment.enrollment.secret}
          </code>
          <p className="text-slate-400 text-2xs">
            Keep this key private. Setup is incomplete until a code is verified. It is not recoverable from this page after leaving.
          </p>
        </div>
      )}

      {choices.length > 0 && (
        <form
          action={verify}
          onSubmit={(event) => {
            const data = new FormData(event.currentTarget);
            const valid = verificationSchema.safeParse({ factorId: data.get("factorId"), code: data.get("code") }).success;
            setInvalid(!valid);
            if (!valid) event.preventDefault();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label htmlFor="factor" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Your TOTP factor
            </label>
            <select
              id="factor"
              name="factorId"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-2xs"
            >
              {choices.map((factor, index) => (
                <option key={factor.id} value={factor.id}>
                  Authenticator {index + 1} ({factor.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="code" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Six-digit authenticator code
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || enrolling}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {verifying ? "Verifying…" : "Verify code"}
          </button>

          {(invalid || verification.error) && (
            <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
              {invalid ? "Enter a six-digit code." : verification.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export function SessionControls({ retry = false }: { retry?: boolean }) {
  const [logout, signOut, pending] = useActionState(signOutAction, {});
  const [recheck, retryAction, retrying] = useActionState(recheckAction, {});

  return (
    <div className="flex flex-wrap items-center gap-2">
      {retry && (
        <form action={retryAction}>
          <button
            type="submit"
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Checking…" : "Recheck access"}</span>
          </button>
          {recheck.error && <p role="alert" className="mt-1 text-xs text-red-600">{recheck.error}</p>}
        </form>
      )}

      <form action={signOut}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-red-600 hover:text-white font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{pending ? "Signing out…" : "Sign out of Admin"}</span>
        </button>
        {logout.error && <p role="alert" className="mt-1 text-xs text-red-600">{logout.error}</p>}
      </form>
    </div>
  );
}
