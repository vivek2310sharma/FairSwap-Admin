import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, PRIVATE_CACHE, type CookieWrite } from "@/lib/supabase/client";
import { requestDiagnostics, observeResult } from "@/lib/auth/diagnostics";

/** Refresh only. Entry-point guards remain authoritative; no policy-error bypass. */
export async function proxy(request: NextRequest) {
  const diagnostics = requestDiagnostics(request.headers.get("host") ?? "", "proxy", request.headers);
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
  }, request.nextUrl.protocol === "https:" || !["localhost", "127.0.0.1"].includes(request.nextUrl.hostname), diagnostics);
  if (client) {
    try {
      const result = await client.auth.getClaims();
      observeResult(diagnostics, "proxy-claims", result);
    } catch (error) { diagnostics.emit("proxy-claims", "exception", error); /* Protected entry points fail closed. */ }
  } else diagnostics.emit("configuration", "error", undefined, "configuration-unavailable");
  const response = NextResponse.next({ request });
  outgoing.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  responseHeaders.forEach((value, name) => response.headers.set(name, value));
  response.headers.set("Cache-Control", PRIVATE_CACHE);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = { matcher: ["/auth/:path*", "/admin/:path*"] };
