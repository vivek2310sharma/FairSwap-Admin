import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { readAuthConfig } from "@/lib/auth/runtime-config";
import { TEST_SUPABASE_URL, PRODUCTION_SUPABASE_URL } from "@/lib/config";
import { attachDiagnostics, type Diagnostics } from "@/lib/auth/diagnostics";

export const ADMIN_COOKIE_NAME = "fairswap-admin-test-auth";
export const PRIVATE_CACHE = "private, no-store, max-age=0, must-revalidate";
export type CookieWrite = { name: string; value: string; options: CookieOptions };
export type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieWrite[], headers: Record<string, string>) => void;
};

function cookieMatches(name: string, cookieName: string) {
  return name === cookieName ||
    new RegExp(`^${cookieName}\\.\\d+$`).test(name) ||
    name === `${cookieName}-code-verifier`;
}

export function isAdminCookie(name: string) { return cookieMatches(name, ADMIN_COOKIE_NAME); }

export function adminCookieOptions(options: CookieOptions, secure: boolean): CookieOptions {
  const safe = { ...options, path: "/", httpOnly: true, sameSite: "lax" as const, secure };
  delete safe.domain;
  return safe;
}

/** Fixed destination even when a token contains an attacker-controlled issuer. */
export function environmentFetch(origin: string): typeof fetch {
  if (![TEST_SUPABASE_URL, PRODUCTION_SUPABASE_URL].includes(origin)) throw new Error("Backend destination rejected.");
  return (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.origin !== origin || url.username || url.password) {
    throw new Error("Backend destination rejected.");
  }
  return fetch(input, { ...init, redirect: "error", cache: "no-store" });
  };
}
export const testOnlyFetch = environmentFetch(TEST_SUPABASE_URL);

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
  const enabledDiagnostics = config.environment === "test" ? diagnostics : undefined;
  const observer = observeRefresh(enabledDiagnostics);
  const transport = config.environment === "test" && enabledDiagnostics?.enabled ? observer.transport : environmentFetch(config.url);
  const cookieSecure = secure || config.environment === "production" || !!process.env.VERCEL_ENV;
  let client: ReturnType<typeof createServerClient>;
  try {
    client = createServerClient(config.url, config.key, {
      cookieOptions: { name: config.cookieName, ...adminCookieOptions({}, cookieSecure) },
      global: { fetch: transport },
      cookies: {
        getAll: () => adapter.getAll().filter(({ name }) => cookieMatches(name, config.cookieName)),
        setAll: (updates, headers) => adapter.setAll(
          updates.filter(({ name }) => cookieMatches(name, config.cookieName)).map((cookie) => ({
            ...cookie, options: adminCookieOptions(cookie.options, cookieSecure),
          })), headers,
        ),
      },
    });
  } catch (error) {
    diagnostics?.emit("configuration", "exception", error);
    throw error;
  }
  if (enabledDiagnostics) attachDiagnostics(client, enabledDiagnostics);
  if (enabledDiagnostics?.enabled) {
    try {
      // Synchronous observer only. Ignore session payload; never call auth here.
      client.auth.onAuthStateChange((event: string) => observer.sdkEvent(event));
    } catch { /* An observer registration failure cannot change client creation. */ }
  }
  return client;
}

export type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
