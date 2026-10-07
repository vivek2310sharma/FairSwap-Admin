import type { AdminResult } from "./mutations";
/** Browser transport completion alone never means the backend operation succeeded. */
export async function safeAdminCall(callback: () => Promise<AdminResult>): Promise<AdminResult> {
  try {
    const result = await callback();
    if (result?.success === true) return { success: true, message: result.message };
    return { error: result?.error || "Operation not confirmed. Refresh before retrying." };
  } catch { return { error: "Operation not confirmed. Refresh before retrying." }; }
}
