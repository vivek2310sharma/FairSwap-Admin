import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, PRIVATE_CACHE, type CookieWrite } from "@/lib/supabase/client";

/** Refresh only. Entry-point guards remain authoritative; no policy-error bypass. */
export async function proxy(request: NextRequest) {
  const outgoing = new Map<string, CookieWrite>();
  const responseHeaders = new Map<string, string>();
  const client = createAdminClient({
    getAll: () => request.cookies.getAll(),
    setAll: (updates, headers) => {
      updates.forEach((cookie) => {
        request.cookies.set(cookie.name, cookie.value);
        outgoing.set(cookie.name, cookie);
      });
      Object.entries(headers).forEach(([name, value]) => responseHeaders.set(name, value));
    },
  }, request.nextUrl.protocol === "https:" || !["localhost", "127.0.0.1"].includes(request.nextUrl.hostname));
  if (client) {
    try { await client.auth.getClaims(); } catch { /* Protected entry points fail closed. */ }
  }
  const response = NextResponse.next({ request });
  outgoing.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  responseHeaders.forEach((value, name) => response.headers.set(name, value));
  response.headers.set("Cache-Control", PRIVATE_CACHE);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = { matcher: ["/auth/:path*", "/admin/:path*"] };
