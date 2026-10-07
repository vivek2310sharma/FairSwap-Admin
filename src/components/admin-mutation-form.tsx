"use client";
import { useActionState, useRef, type ReactNode } from "react";
import type { AdminResult } from "@/lib/admin/mutations";

export function AdminMutationForm({ mutation, children, className, confirm }: {
  mutation: (state: AdminResult | null, form: FormData) => Promise<AdminResult>;
  children: ReactNode; className?: string; confirm?: string;
}) {
  const busy = useRef(false);
  const [state, action, pending] = useActionState(async (previous: AdminResult | null, form: FormData) => {
    try { return await mutation(previous, form); }
    catch { return { error: "Operation not confirmed. Refresh before retrying." }; }
    finally { busy.current = false; }
  }, null);
  return <form action={action} className={className} onSubmit={(event) => {
    if (busy.current || pending || (confirm && !window.confirm(confirm))) { event.preventDefault(); return; }
    busy.current = true;
  }}>
    <fieldset disabled={pending}>{children}</fieldset>
    {pending && <p role="status">Submitting…</p>}
    {state?.error && <p role="alert">{state.error}</p>}
    {state?.success === true && <p role="status">{state.message}</p>}
  </form>;
}
