import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { readAuthConfig } from "@/lib/auth/runtime-config";
import { TEST_SUPABASE_URL } from "@/lib/config";
import { attachDiagnostics, type Diagnostics } from "@/lib/auth/diagnostics";

export const ADMIN_COOKIE_NAME = "fairswap-admin-test-auth";
export const PRIVATE_CACHE = "private, no-store, max-age=0, must-revalidate";
export type CookieWrite = { name: string; value: string; options: CookieOptions };
export type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieWrite[], headers: Record<string, string>) => void;
};

export function isAdminCookie(name: string) {
  return name === ADMIN_COOKIE_NAME ||
    new RegExp(`^${ADMIN_COOKIE_NAME}\\.\\d+$`).test(name) ||
    name === `${ADMIN_COOKIE_NAME}-code-verifier`;
}

export function adminCookieOptions(options: CookieOptions, secure: boolean): CookieOptions {
  const safe = { ...options, path: "/", httpOnly: true, sameSite: "lax" as const, secure };
  delete safe.domain;
  return safe;
}

/** Fixed destination even when a token contains an attacker-controlled issuer. */
export const testOnlyFetch: typeof fetch = (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.origin !== TEST_SUPABASE_URL || url.username || url.password) {
    throw new Error("Backend destination rejected.");
  }
  return fetch(input, { ...init, redirect: "error", cache: "no-store" });
};

/** Observe the pinned SDK's POST refresh grant without reading any body. */
export function observeRefresh(diagnostics?: Diagnostics) {
  let successfulHTTP = false;
  const transport: typeof fetch = (input, init) => {
    let refresh = false;
    try {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      const method = init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET");
      refresh = !!diagnostics?.enabled && url.origin === TEST_SUPABASE_URL && !url.username && !url.password &&
        url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token" && method.toUpperCase() === "POST";
    } catch { /* Destination validation remains the original transport's job. */ }
    if (!refresh) return testOnlyFetch(input, init);
    diagnostics?.emit("refresh", "attempt", undefined, "code-unavailable");
    successfulHTTP = false;
    try {
      return testOnlyFetch(input, init).then((response) => {
        try {
          const status = response.status;
          successfulHTTP = status >= 200 && status < 300;
          diagnostics?.emit("refresh", successfulHTTP ? "http-success" : "http-error", undefined, "code-unavailable", status);
        } catch {
          successfulHTTP = false;
          diagnostics?.emit("refresh", "error", undefined, "unclassified");
        }
        return response; // Same response, never cloned/read/consumed by diagnostics.
      }, (error: unknown) => {
        diagnostics?.emit("refresh", "exception", error);
        throw error;
      });
    } catch (error) {
      diagnostics?.emit("refresh", "exception", error);
      throw error;
    }
  };
  return { transport, sdkEvent(event: string) {
    if (event === "TOKEN_REFRESHED" && successfulHTTP) {
      successfulHTTP = false;
      diagnostics?.emit("refresh", "sdk-success");
    }
  } };
}

/** No singleton: authenticated storage is isolated to this request. */
export function createAdminClient(adapter: CookieAdapter, secure: boolean, diagnostics?: Diagnostics) {
  const config = readAuthConfig();
  if (!config) {
    diagnostics?.emit("configuration", "error", undefined, "configuration-unavailable");
    return null;
  }
  const observer = observeRefresh(diagnostics);
  let client: ReturnType<typeof createServerClient>;
  try {
    client = createServerClient(config.url, config.key, {
      cookieOptions: { name: ADMIN_COOKIE_NAME, ...adminCookieOptions({}, secure) },
      global: { fetch: diagnostics?.enabled ? observer.transport : testOnlyFetch },
      cookies: {
        getAll: () => adapter.getAll().filter(({ name }) => isAdminCookie(name)),
        setAll: (updates, headers) => adapter.setAll(
          updates.filter(({ name }) => isAdminCookie(name)).map((cookie) => ({
            ...cookie, options: adminCookieOptions(cookie.options, secure),
          })), headers,
        ),
      },
    });
  } catch (error) {
    diagnostics?.emit("configuration", "exception", error);
    throw error;
  }
  if (diagnostics) attachDiagnostics(client, diagnostics);
  if (diagnostics?.enabled) {
    try {
      // Synchronous observer only. Ignore session payload; never call auth here.
      client.auth.onAuthStateChange((event: string) => observer.sdkEvent(event));
    } catch { /* An observer registration failure cannot change client creation. */ }
  }
  return client;
}

export type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
