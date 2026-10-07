import "server-only";
import { redirect } from "next/navigation";
import { requestClient } from "@/lib/supabase/server";
import { staffAccess, type StaffRole } from "@/lib/auth/guard";
import type { AdminClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Failed reads must reach the error boundary, never masquerade as an empty queue.
function checkedQuery<T extends object>(query: T): T {
  return new Proxy(query, { get(target, key) {
    if (key === "then") return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(target).then((result) => {
        if (result && typeof result === "object" && "error" in result && result.error) throw new Error("Data unavailable. Refresh or contact the backend owner.");
        return result;
      }).catch(() => { throw new Error("Data unavailable. Refresh or contact the backend owner."); }).then(resolve, reject);
    const member = Reflect.get(target, key);
    if (typeof member !== "function") return member;
    return (...args: unknown[]) => {
      const next = Reflect.apply(member, target, args);
      return next && typeof next === "object" ? checkedQuery(next) : next;
    };
  } });
}

/** Every migrated page supplies a reviewed role allowlist, independently of navigation. */
export async function pageClient(roles: readonly StaffRole[]): Promise<SupabaseClient<Database>> {
  const client = await requestClient();
  if (!client) throw new Error("Configuration unavailable.");
  const access = await staffAccess(client, true, roles);
  if (!access.allowed) {
    if (access.reason === "sign-in") redirect("/auth/sign-in");
    if (access.reason === "mfa") redirect("/auth/mfa");
    if (access.reason === "denied") redirect("/admin?denied=1");
    redirect("/admin");
  }
  return new Proxy(client, { get(target, key) {
    if (key === "from") return (...args: Parameters<AdminClient["from"]>) => checkedQuery(target.from(...args));
    if (key === "rpc") return (...args: Parameters<AdminClient["rpc"]>) => checkedQuery(target.rpc(...args));
    const member = Reflect.get(target, key);
    return typeof member === "function" ? member.bind(target) : member;
  } }) as unknown as SupabaseClient<Database>;
}
