"use client";

import { useActionState, useState } from "react";
import { signInAction, enrollAction, verifyAction, signOutAction, recheckAction } from "@/app/auth/actions";
import { signInSchema, verificationSchema } from "@/lib/auth/inputs";

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, {});
  const [invalid, setInvalid] = useState(false);
  return <form action={action} onSubmit={(event) => {
    const form = new FormData(event.currentTarget);
    const valid = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") }).success;
    setInvalid(!valid);
    if (!valid) event.preventDefault();
  }}>
    <label htmlFor="email">Staff email</label>
    <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
    <label htmlFor="password">Password</label>
    <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={4096} />
    <input type="hidden" name="next" value="/admin" />
    <button disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    {(invalid || state.error) && <p role="alert">{invalid ? "Enter a valid email and password." : state.error}</p>}
  </form>;
}

export function MfaForms({ factors, issuer = "FairSwap Admin" }: { factors: { id: string; status: string }[]; issuer?: string }) {
  const [enrollment, enroll, enrolling] = useActionState(enrollAction, {});
  const [verification, verify, verifying] = useActionState(verifyAction, {});
  const [invalid, setInvalid] = useState(false);
  const choices = enrollment.enrollment ? [{ id: enrollment.enrollment.factorId, status: "unverified" }] : factors;
  return <>
    {!factors.length && !enrollment.enrollment && <form action={enroll}>
      <p>Set up your own authenticator only through the supervised staff process.</p>
      <button disabled={enrolling || verifying}>{enrolling ? "Preparing authenticator…" : "Begin TOTP enrollment"}</button>
    </form>}
    {enrollment.error && <p role="alert">{enrollment.error}</p>}
    {enrollment.enrollment && <div role="status">
      <p>In your authenticator, add a time-based account named {issuer} using this setup key:</p>
      <code>{enrollment.enrollment.secret}</code>
      <p>Keep this key private. Setup is incomplete until a code is verified. It is not recoverable from this page after leaving.</p>
    </div>}
    {choices.length > 0 && <form action={verify} onSubmit={(event) => {
      const data = new FormData(event.currentTarget);
      const valid = verificationSchema.safeParse({ factorId: data.get("factorId"), code: data.get("code") }).success;
      setInvalid(!valid);
      if (!valid) event.preventDefault();
    }}>
      <label htmlFor="factor">Your TOTP factor</label>
      <select id="factor" name="factorId">{choices.map((factor, index) => <option key={factor.id} value={factor.id}>Authenticator {index + 1} ({factor.status})</option>)}</select>
      <label htmlFor="code">Six-digit authenticator code</label>
      <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
      <button disabled={verifying || enrolling}>{verifying ? "Verifying…" : "Verify code"}</button>
      {(invalid || verification.error) && <p role="alert">{invalid ? "Enter a six-digit code." : verification.error}</p>}
    </form>}
  </>;
}

export function SessionControls({ retry = false }: { retry?: boolean }) {
  const [logout, signOut, pending] = useActionState(signOutAction, {});
  const [recheck, retryAction, retrying] = useActionState(recheckAction, {});
  return <>
    {retry && <form action={retryAction}><button disabled={retrying}>{retrying ? "Checking…" : "Recheck access"}</button>{recheck.error && <p role="alert">{recheck.error}</p>}</form>}
    <form action={signOut}><button disabled={pending}>{pending ? "Signing out…" : "Sign out of Admin"}</button>{logout.error && <p role="alert">{logout.error}</p>}</form>
  </>;
}
