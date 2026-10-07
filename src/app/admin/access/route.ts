import { NextResponse } from "next/server";
import { requireStaffAccess } from "@/lib/auth/guard";
import { PRIVATE_CACHE } from "@/lib/supabase/client";

/** Minimal read-only protected endpoint; no staff data or mutation. */
export async function GET() {
  const access = await requireStaffAccess();
  return NextResponse.json(access.allowed ? { access: "confirmed" } : { access: "denied" }, {
    status: access.allowed ? 200 : 403,
    headers: { "Cache-Control": PRIVATE_CACHE, Pragma: "no-cache", Expires: "0" },
  });
}
