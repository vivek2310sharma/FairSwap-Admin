import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { adminMutation, type AdminMutation, type AdminResult } from "./mutations";

export async function submitAdminMutation(input: AdminMutation, paths: readonly string[]): Promise<AdminResult> {
  try {
    const h = await headers();
    const result = await adminMutation(input, h.get("origin"), h.get("host"));
    // Do not repeat an acknowledged mutation if UI revalidation fails.
    if (result.success) for (const path of paths) { try { revalidatePath(path); } catch { return { ...result, message: "Backend operation completed. Reload to see the current state." }; } }
    return result;
  } catch { return { error: "Operation not confirmed. Refresh before retrying." }; }
}

export function field(form: FormData, key: string): string | null {
  const value = form.get(key); return typeof value === "string" && value.trim() ? value.trim() : null;
}
